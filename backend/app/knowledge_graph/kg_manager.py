# backend/app/knowledge_graph/kg_manager.py

from neo4j import GraphDatabase
from flask import current_app
from langchain_community.graphs import Neo4jGraph
from langchain.chains import GraphCypherQAChain
from langchain_google_genai import ChatGoogleGenerativeAI
# NEW: Import for building custom prompts
from langchain.prompts import PromptTemplate

# NEW: A more advanced prompt that tells the LLM how to use our specific dataSourceId
CYPHER_GENERATION_TEMPLATE = """
Task:
Generate a Cypher query to answer the user's question.
The user is asking about a specific software repository identified by the `dataSourceId`: "{data_source_id}".
ALL nodes in the graph are labeled with a `dataSourceId` property. Your query MUST use this property in a WHERE clause to filter for the correct repository.

Schema:
{schema}

Instructions:
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided.
If you cannot generate a query, return a blank string.

Examples:
# How many functions are in the file "main.py"?
MATCH (f:File {{path: "main.py", dataSourceId: "{data_source_id}"}})-[:DEFINES]->(func:Function)
RETURN count(func)

# What functions does "login_user" call?
MATCH (caller:Function {{name: "login_user", dataSourceId: "{data_source_id}"}})-[:CALLS]->(callee:Function)
RETURN callee.name

Question: {question}
Cypher Query:
"""

CYPHER_GENERATION_PROMPT = PromptTemplate(
    input_variables=["schema", "question", "data_source_id"], template=CYPHER_GENERATION_TEMPLATE
)
class KnowledgeGraphManager:
    """Manages all interactions with the Neo4j Knowledge Graph."""
    def __init__(self):
        uri = current_app.config.get('NEO4J_URI')
        user = current_app.config.get('NEO4J_USERNAME')
        password = current_app.config.get('NEO4J_PASSWORD')

        if not all([uri, user, password]):
            raise ValueError("Neo4j credentials are not configured in the application.")
            
        self._driver = GraphDatabase.driver(uri, auth=(user, password))
        self.graph = Neo4jGraph(url=uri, username=user, password=password)

    def close(self):
        """Closes the database connection driver."""
        if self._driver:
            self._driver.close()

    def run_query(self, query, parameters=None):
        """A generic method to run a Cypher query against the database."""
        with self._driver.session() as session:
            result = session.run(query, parameters)
            return [record for record in result]
    def query_graph(self, natural_language_query: str, data_source_id: str) -> str:
        """
        Takes a natural language query AND a data_source_id, converts it to a
        Cypher query, executes it, and returns a natural language response.
        """
        current_app.logger.info(f"KG Tool: Received query -> '{natural_language_query}' for data source '{data_source_id}'")
        try:
            llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0, convert_system_message_to_human=True)

            # We now use our custom prompt that includes the data_source_id
            chain = GraphCypherQAChain.from_llm(
                graph=self.graph,
                llm=llm,
                cypher_prompt=CYPHER_GENERATION_PROMPT.partial(data_source_id=data_source_id), # Pass the ID to the prompt
                verbose=True
            )

            result = chain.invoke({"query": natural_language_query})
            
            answer = result.get("result", "I could not find an answer in the knowledge graph for that question.")
            current_app.logger.info(f"KG Tool: Produced answer -> '{answer}'")
            return answer
            
        except Exception as e:
            current_app.logger.error(f"Error querying knowledge graph: {e}", exc_info=True)
            return "There was an error while querying the knowledge graph."
        
    def add_file_node(self, data_source_id: str, file_path: str):
        """Adds a 'File' node to the graph if it doesn't already exist."""
        query = (
            "MERGE (f:File {path: $file_path, dataSourceId: $data_source_id}) "
            "RETURN f"
        )
        parameters = {"file_path": file_path, "data_source_id": data_source_id}
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Merged File node for {file_path}")
    def add_class_node(self, data_source_id: str, file_path: str, class_name: str, docstring: str, base_classes: list[str]):
        """Adds a 'Class' node, links it to its file, and links its inheritance."""
        # Step 1: Create the Class node and link it to the file it's defined in.
        query = (
            "MERGE (file:File {path: $file_path, dataSourceId: $data_source_id}) "
            "MERGE (class:Class {name: $class_name, file_path: $file_path, dataSourceId: $data_source_id}) "
            "ON CREATE SET class.summary = $docstring "
            "MERGE (file)-[:DEFINES_CLASS]->(class)"
        )
        parameters = {
            "file_path": file_path,
            "class_name": class_name,
            "docstring": docstring,
            "data_source_id": data_source_id
        }
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Merged Class '{class_name}'.")

        # Step 2: Link the class to its base classes (inheritance).
        if base_classes:
            # This query finds the current class and its parent classes and creates INHERITS_FROM relationships.
            # It assumes base classes are in the same repo; cross-library inheritance is a more advanced topic.
            inheritance_query = (
                "MATCH (class:Class {name: $class_name, file_path: $file_path, dataSourceId: $data_source_id}) "
                "UNWIND $base_classes AS base_class_name "
                "MATCH (base_class:Class {name: base_class_name, dataSourceId: $data_source_id}) "
                "MERGE (class)-[:INHERITS_FROM]->(base_class)"
            )
            inheritance_params = {
                "class_name": class_name,
                "file_path": file_path,
                "data_source_id": data_source_id,
                "base_classes": base_classes
            }
            self.run_query(inheritance_query, inheritance_params)
            current_app.logger.debug(f"KG: Linked inheritance for '{class_name}'.")

    def add_call_relationship(self, data_source_id: str, caller_name: str, caller_file: str, callee_name: str):
        """Adds a 'CALLS' relationship between two functions/methods."""
        # This query is critical for tracing execution flow. It finds the calling function
        # and the function being called and creates a directional CALLS relationship.
        query = (
            "MATCH (caller:Function {name: $caller_name, file_path: $caller_file, dataSourceId: $data_source_id}) "
            "MATCH (callee:Function {name: $callee_name, dataSourceId: $data_source_id}) "
            "MERGE (caller)-[:CALLS]->(callee)"
        )
        parameters = {
            "caller_name": caller_name,
            "caller_file": caller_file,
            "callee_name": callee_name,
            "data_source_id": data_source_id
        }
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Linked call from '{caller_name}' to '{callee_name}'.")

    def add_import_relationship(self, data_source_id: str, file_path: str, module: str, name: str, asname: str):
        """Adds an 'IMPORTS' relationship from a file to a module/object."""
        # This helps in understanding dependencies between files.
        import_name = name or module
        query = (
            "MERGE (file:File {path: $file_path, dataSourceId: $data_source_id}) "
            "MERGE (mod:Module {name: $import_name}) " # Modules are global, not tied to a data source
            "MERGE (file)-[:IMPORTS]->(mod)"
        )
        parameters = {
            "file_path": file_path,
            "import_name": import_name,
            "data_source_id": data_source_id 
        }
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Linked import from '{file_path}' to '{import_name}'.")
    def add_function_node(self, data_source_id: str, file_path: str, function_name: str, docstring: str, class_name: str | None = None):
        """
        Adds a 'Function' node and links it to its containing file or class.
        Now includes docstring summary and handles methods within classes.
        """
        if class_name:
            # This is a method. Link it to the Class.
            query = (
                "MATCH (class:Class {name: $class_name, file_path: $file_path, dataSourceId: $data_source_id}) "
                "MERGE (func:Function {name: $function_name, file_path: $file_path, dataSourceId: $data_source_id}) "
                "ON CREATE SET func.summary = $docstring "
                "MERGE (class)-[:HAS_METHOD]->(func)"
            )
            parameters = {
                "class_name": class_name,
                "function_name": function_name,
                "file_path": file_path,
                "docstring": docstring,
                "data_source_id": data_source_id
            }
            current_app.logger.debug(f"KG: Merged Method '{function_name}' for Class '{class_name}'.")
        else:
            # This is a standalone function. Link it to the File.
            query = (
                "MATCH (file:File {path: $file_path, dataSourceId: $data_source_id}) "
                "MERGE (func:Function {name: $function_name, file_path: $file_path, dataSourceId: $data_source_id}) "
                "ON CREATE SET func.summary = $docstring "
                "MERGE (file)-[:DEFINES_FUNCTION]->(func)" # A more specific relationship name
            )
            parameters = {
                "file_path": file_path,
                "function_name": function_name,
                "docstring": docstring,
                "data_source_id": data_source_id
            }
            current_app.logger.debug(f"KG: Merged Function '{function_name}'.")

        self.run_query(query, parameters)
    def clear_data_source_data(self, data_source_id: str):
        """Deletes all nodes and their relationships associated with a specific data source."""
        query = (
            "MATCH (n {dataSourceId: $data_source_id}) "
            "DETACH DELETE n"
        )
        parameters = {"data_source_id": data_source_id}
        self.run_query(query, parameters)
        current_app.logger.info(f"KG: Cleared all graph data for data source {data_source_id}.")
    def execute_cypher_query(self, cypher_query: str) -> list[dict]:
        """
        Executes a raw Cypher query and returns the raw, structured results.
        """
        current_app.logger.info(f"KG Manager: Executing raw cypher: {cypher_query}")
        try:
            with self._driver.session() as session:
                result = session.run(cypher_query)
                # Return the records as a list of dictionaries
                records = [record.data() for record in result]
                return records
        except Exception as e:
            current_app.logger.error(f"Failed to execute Cypher query. Error: {e}")
            return [] # Return an empty list on error
    def add_directory_node(self, data_source_id: str, directory_path: str):
        """
        Adds a 'Directory' node to the graph if it doesn't already exist.
        Also initializes a placeholder 'summary' property.
        """
        # This query creates a Directory node, uniquely identified by its path and data source.
        # The SET d.summary = '' part adds the summary property, preparing it for future summarization tasks.
        query = (
            "MERGE (d:Directory {path: $directory_path, dataSourceId: $data_source_id}) "
            "ON CREATE SET d.summary = '' "
            "RETURN d"
        )
        parameters = {"directory_path": directory_path, "data_source_id": data_source_id}
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Merged Directory node for {directory_path}")

    def link_directory_to_child(self, data_source_id: str, parent_dir_path: str, child_path: str, child_type: str):
        """
        Links a parent Directory node to a child node (either a File or another Directory).
        `child_type` must be either 'File' or 'Directory'.
        """
        if child_type not in ["File", "Directory"]:
            current_app.logger.error(f"KG: Invalid child_type '{child_type}' for linking. Must be 'File' or 'Directory'.")
            return

        # This query finds the parent directory and the child node (which can be a File or Directory)
        # and creates a CONTAINS relationship between them, building the hierarchy.
        query = (
            f"MATCH (parent:Directory {{path: $parent_dir_path, dataSourceId: $data_source_id}}) "
            f"MATCH (child:{child_type} {{path: $child_path, dataSourceId: $data_source_id}}) "
            "MERGE (parent)-[:CONTAINS]->(child)"
        )
        parameters = {
            "parent_dir_path": parent_dir_path,
            "child_path": child_path,
            "data_source_id": data_source_id
        }
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Linked {parent_dir_path} -> {child_path}")

    # Also, modify the existing `add_file_node` method to add the summary property:

    def add_file_node(self, data_source_id: str, file_path: str):
        """Adds a 'File' node to the graph if it doesn't already exist."""
        query = (
            # MODIFICATION: Added "ON CREATE SET f.summary = ''"
            "MERGE (f:File {path: $file_path, dataSourceId: $data_source_id}) "
            "ON CREATE SET f.summary = '' "
            "RETURN f"
        )
        parameters = {"file_path": file_path, "data_source_id": data_source_id}
        self.run_query(query, parameters)
        current_app.logger.debug(f"KG: Merged File node for {file_path}")