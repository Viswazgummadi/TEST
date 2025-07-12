from .graph import AgentState
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from ..utils.llm_utils import get_llm_for_graph # We will create this helper function

# --- 1. Define the Planner's Prompt (Corrected Version) ---
PLANNER_PROMPT = """
You are an expert AI agent system planner. Your role is to analyze a user's query and create the simplest possible plan.

**Core Instruction:**
Your primary goal is to DELEGATE the hard work to your specialist tools, not to create a complex multi-step plan yourself. For almost any question about the codebase, the plan should be a SINGLE step: to use the knowledge graph.

1.  **Decompose the Query:** Rewrite the user's latest query into a clear, standalone, and "decomposed" question for the tools.

2.  **Create a Plan:** Create a step-by-step plan.
    - If the user is asking a question about the code, the plan MUST be a single step:
      `"Use 'knowledge_graph_search' to answer the user's question."`
    - Only if the user explicitly asks to "read the contents of file X.py" should you use the `file_reader_tool`.

**Available Tools:**
*   `knowledge_graph_search`: The primary tool for ALL questions about code, structure, relationships, or functionality.
*   `file_reader_tool`: Use only when specifically asked to read a file.

**User's Query:**
{query}

**Conversation History:**
{chat_history}

**Your Response:**
You MUST provide your response as a single, valid JSON object with "decomposed_query" and "plan" keys.

**Example for a code question:**
{{
  "decomposed_query": "Explain the overall architecture of the project and its main components.",
  "plan": [
    "Use 'knowledge_graph_search' to answer the user's question."
  ]
}}
"""
# --- 2. Create the Planner Node Function ---
def planner_node(state: AgentState) -> dict:
    """
    Takes the user query and plans the steps to answer it.
    
    Args:
        state (AgentState): The current state of the agent graph.
        
    Returns:
        dict: A dictionary with the `decomposed_query` and `plan`.
    """
    print("---EXECUTING PLANNER NODE---")
    
    history = "\n".join([f"{msg.type}: {msg.content}" for msg in state['chat_history']])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", PLANNER_PROMPT),
        ("human", "User Query: {query}\n\nChat History:\n{chat_history}")
    ])
    
    llm = get_llm_for_graph(state)
    planner_chain = prompt | llm
    
    response_str = planner_chain.invoke({
        "query": state['original_query'],
        "chat_history": history
    }).content
    
    # --- THIS IS THE MODIFIED PART ---
    try:
        import json
        # Robustly find the JSON object within the response string
        json_start_index = response_str.find('{')
        json_end_index = response_str.rfind('}') + 1
        
        if json_start_index == -1 or json_end_index == 0:
            raise json.JSONDecodeError("Could not find JSON object in LLM response.", response_str, 0)
            
        clean_json_str = response_str[json_start_index:json_end_index]
        response_json = json.loads(clean_json_str)

        print(f"Planner Output: {response_json}")
        return {
            "decomposed_query": response_json.get("decomposed_query", ""),
            "plan": response_json.get("plan", [])
        }
    except json.JSONDecodeError:
        print(f"Error: Planner failed to return valid JSON. Output was:\n{response_str}")
        # Even on failure, we provide the expected keys to avoid breaking the graph
        return {
            "decomposed_query": "Failed to parse plan.",
            "plan": []
        }