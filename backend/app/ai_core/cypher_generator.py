from .graph import AgentState
from ..utils.llm_utils import get_llm_for_graph
from ..knowledge_graph.kg_manager import KnowledgeGraphManager
from langchain_core.prompts import PromptTemplate

CYPHER_GENERATION_TEMPLATE = """
You are an expert Neo4j developer. Your task is to generate a Cypher query to answer a user's question about a software repository.
Task:
- The user's query is about a repository identified by a `repo_id`.
- ALL nodes in the graph are labeled with a `dataSourceId` property which corresponds to this `repo_id`.
- Your generated query MUST use this `dataSourceId` in a WHERE clause for every MATCH statement to filter for the correct repository. This is critical.
Schema:
The graph schema is as follows:
{schema}
Instructions:
- Use only the relationship types and properties from the schema provided.
- If you need to match a string, use the `CONTAINS` operator for flexibility (e.g., `WHERE func.name CONTAINS 'auth'`).
- If the question cannot be answered with a Cypher query, return only the string "SCHEMA_UNHELPFUL".
User's Decomposed Query: {question}
Repository ID: {repo_id}
Cypher Query (return only the query itself):
"""

CYPHER_PROMPT = PromptTemplate(
    input_variables=["schema", "question", "repo_id"], template=CYPHER_GENERATION_TEMPLATE
)

def generate_cypher_query(state: AgentState) -> str | None:
    """
    Generates a Cypher query based on the decomposed query.
    Returns the query string or None if it's not possible.
    """
    kg_manager = KnowledgeGraphManager()
    graph_schema = kg_manager.graph.schema

    llm = get_llm_for_graph(state)
    cypher_chain = CYPHER_PROMPT | llm

    response_content = cypher_chain.invoke({
        "schema": graph_schema,
        "question": state['decomposed_query'],
        "repo_id": state['repo_id']
    }).content

    # Clean the response to remove markdown fences and whitespace
    generated_query = response_content.strip()
    if generated_query.lower().startswith("```cypher"):
        generated_query = generated_query[len("```cypher"):].strip()
    elif generated_query.startswith("```"):
        generated_query = generated_query[len("```"):].strip()

    if generated_query.endswith("```"):
        generated_query = generated_query[:-len("```")].strip()

    if not generated_query or "SCHEMA_UNHELPFUL" in generated_query:
        return None

    return generated_query