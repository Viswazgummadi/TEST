#
# This is the FINAL, DEFINITIVE version of backend/app/ai_core/cypher_generator.py
#
import ast
from flask import current_app
from ..utils.llm_utils import get_llm_for_graph
from langchain_core.prompts import PromptTemplate
from .graph import AgentState # Assuming AgentState is defined in graph.py

# This is the final, most robust prompt. It has an unambiguous schema and is designed
# to avoid repeating queries, forcing it to dig deeper on subsequent calls.
CYPHER_GENERATION_TEMPLATE = """
You are a Cypher query expert. Your task is to generate a single, precise Cypher query to answer a question about a codebase.

**Graph Schema:**
- **Node Reference:**
  - `Directory` properties: {{path: str, dataSourceId: str}}
  - `File` properties: {{path: str, summary: str, dataSourceId: str}}
  - `Class` properties: {{name: str, file_path: str, summary: str, dataSourceId: str}}
  - `Function` properties: {{name: str, file_path: str, summary: str, dataSourceId: str}}
- **Relationship Reference:**
  - `(:Directory)-[:CONTAINS]->(:File)`
  - `(:File)-[:DEFINES_CLASS]->(:Class)`
  - `(:File)-[:DEFINES_FUNCTION]->(:Function)`
  - `(:Class)-[:HAS_METHOD]->(:Function)`
  - `(:Function)-[:CALLS]->(:Function)`

**Instructions:**
1.  Analyze the "User's Query" to understand the user's ultimate goal.
2.  Use the "Query Examples" as a guide for the type of query to generate.
3.  Review the "Previously Attempted Queries" to avoid repetition. Generate a NEW query that finds different, deeper information. For example, if you already have the summary, try finding the function's calls next.
4.  You MUST filter every repository node by `dataSourceId: '{repo_id}'`.
5.  Return ONLY the Cypher query. If you cannot generate a new, useful query, return an empty string.

**Query Examples:**
# Goal: Get a function's documentation.
MATCH (f:Function {{name: 'command_loop', file_path: 'ui_handler.py', dataSourceId: '{repo_id}'}}) RETURN f.summary AS summary
# Goal: List the methods in a class.
MATCH (c:Class {{name: 'Peer', dataSourceId: '{repo_id}'}})-[:HAS_METHOD]->(m:Function) RETURN m.name as method_name
# Goal: Trace what a function calls.
MATCH (start:Function {{name: 'command_loop', dataSourceId: '{repo_id}'}})-[:CALLS]->(callee:Function) RETURN callee.name AS called_function

**Your Task:**

User's Query: {question}
Repository ID: {repo_id}
Previously Attempted Queries:
{attempted_queries}

New, Different Cypher Query:
"""

CYPHER_PROMPT = PromptTemplate(
    input_variables=["schema", "question", "repo_id", "attempted_queries"],
    template=CYPHER_GENERATION_TEMPLATE
)

def generate_cypher_query(state: AgentState, attempted_queries: list[str]) -> str | None:
    """
    Generates a new, unique Cypher query based on the decomposed query, avoiding
    previously attempted queries.
    """
    from ..knowledge_graph.kg_manager import KnowledgeGraphManager
    
    kg_manager = KnowledgeGraphManager()
    graph_schema = kg_manager.graph.schema # You might want to cache this
    kg_manager.close()

    llm = get_llm_for_graph(state)
    cypher_chain = CYPHER_PROMPT | llm

    response_content = cypher_chain.invoke({
        "schema": graph_schema,
        "question": state['decomposed_query'],
        "repo_id": state['repo_id'],
        "attempted_queries": "\n".join(attempted_queries)
    }).content

    # Clean the response
    generated_query = response_content.strip().replace("```cypher", "").replace("```", "").strip()

    if not generated_query or "no new query" in generated_query.lower():
        return None

    return generated_query