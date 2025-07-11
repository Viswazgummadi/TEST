# backend/app/ai_core/tools.py

from langchain.tools import tool
# CHANGED: from backend.app.knowledge_graph... to from ..knowledge_graph...
from ..knowledge_graph.kg_manager import KnowledgeGraphManager 
# CHANGED: from backend.app.vector_db... to from ..vector_db...
from ..vector_db.vector_store_manager import VectorStoreManager
# CHANGED: from backend.app.utils... to from ..utils...
from ..utils.file_reader import read_file_from_repo

# --- Tool 1: Knowledge Graph Search ---
@tool
def knowledge_graph_search(query: str, data_source_id: str) -> str:
    """
    MUST be used for questions about the codebase's structure, relationships, or contents.
    Use it to find out how different parts of the code are connected.
    You MUST provide the user's original 'query' and the 'data_source_id' for the repository being analyzed.
    For example: 'What functions are defined in the file main.py?', 'Show me the functions that call the login_user function',
    or 'Which classes inherit from the User model?'
    """
    kg_manager = None
    try:
        kg_manager = KnowledgeGraphManager()
        result = kg_manager.query_graph(natural_language_query=query, data_source_id=data_source_id)
        return result
    except Exception as e:
        print(f"An error occurred in the knowledge graph tool: {e}")
        return "Error: Could not process the query for the knowledge graph."
    finally:
        if kg_manager:
            kg_manager.close()

# --- Tool 2: Semantic Code Search ---
@tool
def semantic_code_search(query: str, data_source_id: str) -> str:
    """
    Use this tool to answer questions about 'how to' do something, or about the functionality and purpose of code.
    It is good for questions that require understanding the meaning of code, not just its structure.
    You MUST provide the user's original 'query' and the 'data_source_id' for the repository being analyzed.
    For example: 'How do I handle user authentication?', 'What part of the code deals with file uploads?',
    or 'Explain the checkout process.'
    """
    try:
        vector_store_manager = VectorStoreManager()
        result = vector_store_manager.query_vectors(query=query, data_source_id=data_source_id)
        return result
    except Exception as e:
        print(f"An error occurred in the semantic code search tool: {e}")
        return "Error: Could not process the query for semantic search."


# --- Tool 3: File Reader Tool ---
@tool
def file_reader_tool(file_path: str, data_source_id: str) -> str:
    """
    Use this tool to read the full content of a specific file from the repository.
    You MUST provide the exact 'file_path' and the 'data_source_id' for the repository you are currently analyzing.
    This is useful when you need to see the raw code to provide an implementation example or to verify details.
    """
    try:
        return read_file_from_repo(data_source_id=data_source_id, file_path=file_path)
    except Exception as e:
        print(f"An error occurred in the file reader tool: {e}")
        return f"Error: Could not read the file {file_path}."

# --- Final list of all tools for the agent ---
all_tools = [knowledge_graph_search, semantic_code_search, file_reader_tool]