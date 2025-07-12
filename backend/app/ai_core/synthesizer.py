from .graph import AgentState
from ..utils.llm_utils import get_llm_for_graph
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage

SYNTHESIZER_TEMPLATE = """
You are an expert software architect and documentation writer. Your task is to provide a comprehensive, clear, and structured answer to a user's question by synthesizing the provided JSON context from a knowledge graph.

**User's Query:**
{query}

**Provided JSON Context from Codebase Analysis:**
```json
{context}
```
Your Instructions:
Understand the Goal: Deeply analyze the "User's Query" to understand what the user truly wants to know.
Synthesize the Context: The JSON context is a collection of results from multiple database queries. It may contain a function's summary, what it calls, who calls it, and what class it belongs to. Your job is to weave all of this information into a single, coherent, and easy-to-read response.
Create a Structured Answer: Structure your answer using Markdown. Start with a high-level summary and then use bullet points to detail the key relationships you found in the context. A good structure would be:
High-Level Summary: What is the primary role of the function/class?
Execution Flow: Describe what it calls and what calls it.
Contextual Placement: Mention the class it belongs to or the file it is in.
Be Specific and Confident: Use the exact names of functions, classes, and files from the context. Do not be vague. You have been given the ground truth from the codebase; present it with confidence.
Do Not State "Based on the provided context." The user knows the information comes from the context. Just present the facts as the answer.
If the context is empty or uninformative, then and only then should you state that you could not find the relevant information."""

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
