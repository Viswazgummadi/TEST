# backend/app/schemas/user_schemas.py
from typing import List, Optional
from pydantic import BaseModel, Field

class UserFactSchema(BaseModel):
    """A concise, general fact about the user, not specific to a codebase."""
    fact_key: str = Field(
        ...,
        description="A brief, descriptive, snake_case identifier for the fact (e.g., 'user_name', 'user_role', 'university_affiliation')."
    )
    fact_value: str = Field(
        ...,
        description="The extracted fact about the user (e.g., 'Viswaz', 'B.Tech student', 'IITDH')."
    )

class UserFactsList(BaseModel):
    """A list of facts extracted about the user."""
    # The 'facts' field is a list of UserFactSchema objects.
    # It will automatically be an empty list if no facts are extracted by the LLM.
    facts: List[UserFactSchema] = Field(
        default_factory=list, # Ensures it defaults to an empty list
        description="A list of extracted user facts. This list should be empty if no relevant facts are found."
    )
    
class RepoSummarySchema(BaseModel):
    """A concise summary of the conversation related to a codebase."""
    summary: str = Field(
        ...,
        description="A concise summary of the conversation, focusing on key questions, answers, decisions, and knowledge gained about the codebase. If no relevant information is present for summarization, explicitly state that (e.g., 'No codebase or technical details discussed yet.')."
    )