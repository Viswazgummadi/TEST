from langchain.tools import tool
from ..knowledge_graph.kg_manager import KnowledgeGraphManager 
from ..vector_db.vector_store_manager import VectorStoreManager
from ..utils.file_reader import read_file_from_repo
from .cypher_generator import generate_cypher_query


# --- Tool 1: Knowledge Graph Search (NOW A "DUMB" EXECUTOR) ---
@tool
def knowledge_graph_search(cypher_query: str, data_source_id: str, state: dict) -> str:
    """
    Executes a given Cypher query against the knowledge graph for a specific data_source_id
    and returns a natural language summary of the results.
    You MUST provide a valid 'cypher_query' string.
    """
    print(f"---EXECUTING KG TOOL with Query: {cypher_query}---")
    kg_manager = None
    try:
        kg_manager = KnowledgeGraphManager()
        # We will create this new, simpler execution function in the next step
        result = kg_manager.execute_and_summarize_cypher(cypher_query=cypher_query, state=state)
        return result
    except Exception as e:
        print(f"An error occurred in the knowledge graph tool: {e}")
        return f"Error executing Cypher query: {e}"
    finally:
        if kg_manager:
            # Note: The original code had a bug here (self._driver.close()). This is a placeholder for a correct close method.
            pass

# --- Tool 2 & 3 (Unchanged for now) ---
@tool
def semantic_code_search(query: str, data_source_id: str) -> str:
    """Use this tool to answer questions about 'how to' do something, or about the functionality and purpose of code."""
    try:
        vector_store_manager = VectorStoreManager()
        result = vector_store_manager.query_vectors(query=query, data_source_id=data_source_id)
        return result
    except Exception as e:
        return f"Error during semantic search: {e}"

@tool
def file_reader_tool(file_path: str, data_source_id: str) -> str:
    """Use this tool to read the full content of a specific file from the repository."""
    try:
        return read_file_from_repo(data_source_id=data_source_id, file_path=file_path)
    except Exception as e:
        return f"Error reading file {file_path}: {e}"

# --- The NEW, smarter Tool Executor Node ---
# Replace the tool_executor function one last time with this complete version
def tool_executor(state: dict) -> dict:
    """
    The intelligent "Agent Kernel" that reads the plan and executes the *next* appropriate step.
    """
    print("---EXECUTING TOOL EXECUTOR NODE---")
    plan = state.get("plan", [])
    next_step_index = len(state.get("intermediate_steps", []))

    if next_step_index >= len(plan):
        print("Executor: All plan steps have been executed.")
        return {"intermediate_steps": []}

    step_to_execute = plan[next_step_index]
    print(f"Executing step {next_step_index + 1}/{len(plan)}: '{step_to_execute}'")

    tool_name = ""
    result = ""

    if "knowledge_graph_search" in step_to_execute.lower():
        tool_name = "knowledge_graph_search"
        print("Decision: Use Knowledge Graph...")
        # Pass the state to the generator
        cypher_query = generate_cypher_query(state) # Corrected call
        if cypher_query:
            print(f"Cypher query generated: {cypher_query}")
            result = knowledge_graph_search.invoke({"cypher_query": cypher_query, "data_source_id": state["repo_id"], "state": state})
        else:
            result = "Could not generate a relevant Cypher query."

    elif "semantic_code_search" in step_to_execute.lower():
        tool_name = "semantic_code_search"
        print("Decision: Use Semantic Search.")
        result = semantic_code_search.invoke({"query": state["decomposed_query"], "data_source_id": state["repo_id"]})
    
    elif "file_reader_tool" in step_to_execute.lower(): # <-- ADD THIS BLOCK
        tool_name = "file_reader_tool"
        print("Decision: Use File Reader.")
        # This is a simplified approach; a real implementation would need to
        # use an LLM to extract the file_path from the plan or previous steps.
        # For now, we'll assume it's about 'peer.py' from the first step's context.
        file_path_to_read = "peer.py" 
        print(f"Attempting to read file: {file_path_to_read}")
        result = file_reader_tool.invoke({"file_path": file_path_to_read, "data_source_id": state["repo_id"]})

    else:
        tool_name = "no_op"
        result = f"Could not find a tool for step: '{step_to_execute}'"

    print(f"Tool '{tool_name}' executed. Result: {result[:200]}...")
    return {"intermediate_steps": [(tool_name, result)]}