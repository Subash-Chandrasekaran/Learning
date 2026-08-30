import os
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
import operator

# Simple LangGraph state example
class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

def sample_graph():
    builder = StateGraph(AgentState)
    
    def echo_node(state: AgentState):
        return {"messages": ["Agent processed state"]}
    
    builder.add_node("echo", echo_node)
    builder.add_edge(START, "echo")
    builder.add_edge("echo", END)
    
    graph = builder.compile()
    result = graph.invoke({"messages": ["Initial user message"]})
    print("Graph execution result:", result)

if __name__ == "__main__":
    print("Testing LangGraph pipeline...")
    sample_graph()
    print("\nLibraries ready:")
    print("- ChatGroq available:", ChatGroq)
    print("- LangGraph StateGraph available:", StateGraph)
