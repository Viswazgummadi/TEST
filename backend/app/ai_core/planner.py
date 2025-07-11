from .graph import AgentState
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
from ..utils.llm_utils import get_llm_for_graph # We will create this helper function

# --- 1. Define the Planner's Prompt (Corrected Version) ---
PLANNER_PROMPT = """
You are an expert AI agent system planner. Your role is to analyze a user's query and the conversation history to create a clear, actionable plan for your internal agent team.

1.  **Decompose the Query:** First, rewrite the user's latest query into a clear, standalone, and "decomposed" question. This question should be optimized for retrieval systems. For example, if the user asks "what about that celery thing?", you should rewrite it to something like "Analyze the Celery configuration and task execution flow in the repository."

2.  **Create a Plan:** Second, create a step-by-step plan to answer the decomposed query. The plan should be a list of simple instructions for your agent team. Focus on which tools to use. The available tools are:
    *   `knowledge_graph_search`: For questions about code structure, definitions, and relationships (e.g., "What functions call X?", "Where is Y defined?").
    *   `semantic_code_search`: For questions about code purpose, functionality, or "how-to" guides (e.g., "How does authentication work?").
    *   `file_reader_tool`: To read the entire content of a specific file.

**User's Query:**
{query}

**Conversation History:**
{chat_history}

**Your Response:**
You MUST provide your response as a single, valid JSON object with two keys: "decomposed_query" and "plan".
The "plan" must be a list of strings.

**Example Response:**
{{
  "decomposed_query": "Find the definition of the `UserFact` model and determine how it is used by the `generate_repo_summary_task` Celery task.",
  "plan": [
    "Use 'knowledge_graph_search' to find the file path and definition of the `UserFact` model.",
    "Use 'semantic_code_search' to find the implementation details of the `generate_repo_summary_task`.",
    "Analyze the results of the previous steps to determine the relationship between the model and the task."
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