// src/data/implementationSteps.js

// This data structure drives the content for the Implementation page.
// Each object represents a section in the visual workflow.

export const implementationSteps = [
  {
    id: 1,
    title: "Code Ingestion & AST Parsing",
    description:
      "We begin by ingesting your repository's source code. Each file is parsed into an Abstract Syntax Tree (AST), a structured tree representation of the code's syntax that allows for deep, semantic understanding.",
    imageUrl: "/feature1.png", // Assumes images are in the public folder
    reverse: false,
  },
  {
    id: 2,
    title: "AST-to-Embedding Transformation",
    description:
      "The parsed ASTs are traversed and converted into meaningful numerical representations, or embeddings. This captures not just keywords, but the contextual relationships between functions, variables, and classes.",
    imageUrl: "/feature2.png",
    reverse: true,
  },
  {
    id: 3,
    title: "Knowledge Base Construction",
    description:
      "These embeddings are then indexed and stored in a specialized vector database. This creates a rich, queryable knowledge base that understands the architecture and logic of your entire codebase.",
    imageUrl: "/feature3.png",
    reverse: false,
  },
  {
    id: 4,
    title: "RAG on Database",
    description:
      "When a query is made, we use a Retrieval-Augmented Generation (RAG) pipeline. The query is converted into an embedding and used to find the most relevant code chunks from the knowledge base.",
    imageUrl: "/feature4.png",
    reverse: true,
  },
  {
    id: 5,
    title: "LLM Query Augmentation",
    description:
      "The retrieved code context is then passed to a Large Language Model (LLM) along with the original query. This gives the model the precise information it needs to generate a highly accurate and context-aware response.",
    imageUrl: "/feature1.png", // Placeholder image
    reverse: false,
  },
  {
    id: 6,
    title: "Pass for Response Generation",
    description:
      "Finally, the LLM synthesizes the information to generate a complete, human-readable answer that directly addresses the user's query, backed by the specific context of their own repository.",
    imageUrl: "/feature2.png", // Placeholder image
    reverse: true,
  },
];
