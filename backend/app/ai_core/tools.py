
from langchain.tools import tool
from ..knowledge_graph.kg_manager import KnowledgeGraphManager
from ..vector_db.vector_store_manager import VectorStoreManager
from ..utils.file_reader import read_file_from_repo
from .cypher_generator import generate_cypher_query
from .graph import AgentState # Assuming this is where your state is defined
import json

@tool
def semantic_code_search(query: str, data_source_id: str) -> str:
    """Use this tool for 'how-to' questions or to find semantically similar code snippets."""
    try:
        vector_store_manager = VectorStoreManager()
        result = vector_store_manager.query_vectors(query=query, data_source_id=data_source_id)
        return json.dumps(result)
    except Exception as e:
        return f"Error during semantic search: {e}"

@tool
def file_reader_tool(file_path: str, data_source_id: str) -> str:
    """Use this tool ONLY when specifically asked to read the full content of a file."""
    try:
        return read_file_from_repo(data_source_id=data_source_id, file_path=file_path)
    except Exception as e:
        return f"Error reading file {file_path}: {e}"


# --- The NEW "Top Notch" Tool Executor ---
# This function REPLACES your old tool_executor. It is the heart of the agent.

def tool_executor(state: AgentState) -> dict:
    """
    The intelligent "Agent Kernel". It replaces the simple tool executor
    with an Information Gathering Loop. It calls the Cypher generator multiple times
    to build a rich context before handing off to the synthesizer.
    """
    print("---EXECUTING INTELLIGENT TOOL EXECUTOR (INFORMATION GATHERING LOOP)---")
    
    plan = state.get("plan", [])
    # The loop should only run if the plan involves KG search.
    if not plan or "knowledge_graph_search" not in plan[0].lower():
        print("Plan does not involve knowledge graph search. Passing.")
        # Handle other tools or return empty if no other logic is needed
        return {"intermediate_steps": []}

    gathered_context = []
    attempted_queries = []
    MAX_ATTEMPTS = 3 # A safeguard to prevent runaway loops

    for i in range(MAX_ATTEMPTS):
        print(f"--- GATHERING ATTEMPT {i + 1}/{MAX_ATTEMPTS} ---")

        # 1. Generate a NEW, UNIQUE query.
        # This now passes the list of previous attempts to the generator.
        cypher_query = generate_cypher_query(state, attempted_queries)

        if not cypher_query or cypher_query in attempted_queries:
            print("Could not generate a new query. Ending gathering process.")
            break
        
        print(f"Generated Query: {cypher_query}")
        attempted_queries.append(cypher_query)

        # 2. Execute the query against the Knowledge Graph.
        kg_manager = None
        try:
            kg_manager = KnowledgeGraphManager()
            query_result = kg_manager.execute_cypher_query(cypher_query)
            kg_manager.close()
        except Exception as e:
            print(f"Error executing query: {e}")
            query_result = []

        # 3. Accumulate results and decide whether to continue.
        if query_result:
            print(f"Query returned {len(query_result)} results.")
            gathered_context.extend(query_result)
        else:
            print("Query returned no new results. Ending gathering process.")
            # Stop if a query returns nothing, as there's likely no more info to find.
            break
    
    # 4. Serialize the final, rich context for the Synthesizer.
    if not gathered_context:
        final_context_str = "No information was found in the knowledge graph after multiple attempts."
    else:
        final_context_str = json.dumps(gathered_context, indent=2)

    print(f"--- FINAL GATHERED CONTEXT FOR SYNTHESIZER ---\n{final_context_str[:500]}...\n------------------------------------")

    # The entire gathered context is passed as a single tool result.
    return {"intermediate_steps": [("knowledge_graph_search", final_context_str)]}