from typing import TypedDict, Annotated, Sequence, List, Dict
import operator
from langchain_core.messages import BaseMessage, AIMessage
from langgraph.graph import StateGraph, END

# --- 1. Define the State: The "Whiteboard" for our agents ---
# This is the definitive state object for our multi-step agent.
class AgentState(TypedDict):
    # -- Core Inputs passed from the API --
    original_query: str
    repo_id: str
    session_id: str
    chat_history: Annotated[Sequence[BaseMessage], operator.add]
    api_key: str
    model_id: str

    # -- Planner Outputs --
    decomposed_query: str
    plan: List[str] # The plan is a simple list of string instructions.

    # -- Tool Execution & Loop Management --
    # This list will grow with each tool call, allowing us to track our progress.
    intermediate_steps: Annotated[list, operator.add]

    # -- Grading & Synthesis --
    # These are populated after the loop is complete.
    context_is_relevant: bool
    
    # -- Final Output for the user --
    final_answer: Annotated[Sequence[BaseMessage], operator.add]


# --- 2. Import the Agent's Node Functions ---
from .planner import planner_node
from .retrieval_grader import retrieval_grader_node
from .synthesizer import synthesizer_node
from .critic import critic_node
from .tools import tool_executor

# --- 3. Define the Conditional Logic for the Loop ---
def check_if_plan_is_complete(state: AgentState) -> str:
    """
    This is the function that controls the agent's main execution loop.
    It checks if the number of steps taken matches the number of steps in the plan.
    """
    print("---DECISION: CHECKING IF PLAN IS COMPLETE---")
    plan = state.get("plan", [])
    steps_run = len(state.get("intermediate_steps", []))

    if steps_run >= len(plan):
        print(f"DECISION: Plan complete ({steps_run}/{len(plan)}). Proceeding to Grader.")
        # If the plan is complete, we exit the loop and proceed to the grading step.
        return "GRADE_CONTEXT"
    else:
        print(f"DECISION: Plan not complete ({steps_run}/{len(plan)}). Looping back to Tool Executor.")
        # If the plan is not complete, we loop back to the tool executor to run the next step.
        return "EXECUTE_NEXT_STEP"

# --- 4. Build the Agent Graph ---
graph_builder = StateGraph(AgentState)

# --- 4a. Define the Nodes ---
# Each node represents a function that our agent will perform.
graph_builder.add_node("planner", planner_node)
graph_builder.add_node("tool_executor", tool_executor)
graph_builder.add_node("retrieval_grader", retrieval_grader_node)
graph_builder.add_node("synthesizer", synthesizer_node)
graph_builder.add_node("critic", critic_node)

# --- 4b. Define the Edges (The Agent's "Brain Wiring") ---
# The entry point is always the planner.
graph_builder.set_entry_point("planner")

# From the planner, we always go to the tool executor for the first time.
graph_builder.add_edge("planner", "tool_executor")

# After the tool executor runs, we hit our conditional decision point.
graph_builder.add_conditional_edges(
    "tool_executor",
    check_if_plan_is_complete,
    # The path_map directs the flow based on the string returned by our condition function.
    path_map={
        "EXECUTE_NEXT_STEP": "tool_executor",      # This creates the loop.
        "GRADE_CONTEXT": "retrieval_grader"        # This exits the loop.
    }
)

# Once the loop is exited, the flow is linear again.
graph_builder.add_edge("retrieval_grader", "synthesizer")
graph_builder.add_edge("synthesizer", "critic")
graph_builder.add_edge("critic", END) # The critic is the final step in the process.

# --- 5. Compile the Graph ---
# This creates the final, runnable agent.
agent_graph = graph_builder.compile()