# backend/app/ai_core/agent.py

from typing import TypedDict, Annotated, Sequence
import operator
import os
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory

from .tools import all_tools

# --- 1. Define the State for our Graph ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    data_source_id: str
    api_key: str
    model_id: str

# --- 2. Define the Nodes of our Graph ---

def tool_router(state: AgentState):
    """
    This node acts as the "brain" of the agent. It decides which tool to call, if any.
    """
    llm_api_key = state.get("api_key", os.environ.get("GEMINI_API_KEY"))
    llm_model_id = state.get("model_id", "gemini-1.5-flash")

    if not llm_api_key:
        raise ValueError("LLM API Key not provided in state or environment variables.")

    llm = ChatGoogleGenerativeAI(
        model=llm_model_id,
        google_api_key=llm_api_key,
        temperature=0,
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        },
    )
    
    llm_with_tools = llm.bind_tools(all_tools)
    
    ai_response = llm_with_tools.invoke(state["messages"])
    
    return {"messages": [ai_response]}


def tool_executor(state: AgentState):
    """
    This node is responsible for actually running the tools.
    """
    last_message = state["messages"][-1]
    tool_call = last_message.tool_calls[0]
    selected_tool = {t.name: t for t in all_tools}[tool_call["name"]]
    tool_args = tool_call["args"]
    tool_args["data_source_id"] = state["data_source_id"]

    response = selected_tool.invoke(tool_args)
    
    from langchain_core.messages import ToolMessage
    return {"messages": [ToolMessage(content=str(response), tool_call_id=tool_call["id"])]}

# --- 3. Define the Logic for Conditional Edges ---

def should_continue(state: AgentState):
    """
    This function decides the next step after the LLM has been called.
    """
    if state["messages"][-1].tool_calls:
        return "use_tool"
    else:
        return END

# --- 4. Assemble the Graph ---

graph_builder = StateGraph(AgentState)
graph_builder.add_node("router", tool_router)
graph_builder.add_node("tool_executor", tool_executor)
graph_builder.set_entry_point("router")
graph_builder.add_conditional_edges(
    "router",
    should_continue,
    {
        "use_tool": "tool_executor",
        END: END
    }
)
graph_builder.add_edge("tool_executor", "router")
agent_graph = graph_builder.compile()