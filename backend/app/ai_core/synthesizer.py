from .graph import AgentState
from ..utils.llm_utils import get_llm_for_graph
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage

SYNTHESIZER_TEMPLATE = """
You are an expert software engineering assistant. Your task is to provide a clear, concise, and helpful answer to a user's question based *only* on the provided context.

User's Decomposed Query:
{query}

Provided Context from Codebase Analysis:
{context}

Instructions:
1. Carefully analyze the user's query and the provided context.
2. Synthesize an answer that directly addresses the query.
3. Base your answer strictly on the information within the provided context. Do not add any information or make any assumptions that are not explicitly supported by the context.
4. If the context is empty or does not contain enough information to answer the query, inform the user that you couldn't find the necessary details in the codebase.
5. Format your answer clearly using Markdown for readability (e.g., use code blocks for function names).

Final Answer:
"""

SYNTHESIZER_PROMPT = ChatPromptTemplate.from_template(SYNTHESIZER_TEMPLATE)

def synthesizer_node(state: AgentState) -> dict:
    print("---EXECUTING SYNTHESIZER NODE---")

    context = "\n\n".join([
        f"Tool: {step[0]}\nResult:\n{step[1]}"
        for step in state.get("intermediate_steps", [])
    ])

    if not context.strip():
        return {
            "final_answer": [AIMessage(content="I apologize, but I was unable to retrieve any context to answer your question.")]
        }

    llm = get_llm_for_graph(state)
    synthesis_chain = SYNTHESIZER_PROMPT | llm

    response = synthesis_chain.invoke({
        "query": state["decomposed_query"],
        "context": context
    })

    print(f"Synthesizer Output:\n---\n{response.content}\n---")

    return {
        "final_answer": [AIMessage(content=response.content)]
    }
