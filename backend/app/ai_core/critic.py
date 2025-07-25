from .graph import AgentState

def critic_node(state: AgentState) -> dict:
    """
    The Critic node. For now, it simply approves the synthesizer's answer
    by passing it through to the final state.
    """
    print("---EXECUTING CRITIC NODE (Pass-through)---")
    
    # Get the answer generated by the synthesizer
    final_answer = state.get("final_answer", [])
    
    if not final_answer:
        print("Critic: No final_answer to pass through.")
        return {}

    # Explicitly return the final_answer to ensure it's in the final state.
    print("Critic: Passing final answer through.")
    return {"final_answer": final_answer}