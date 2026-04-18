"""
LangGraph AI Agent for HCP CRM
Manages HCP interactions using 5 specialized tools:
1. log_interaction     - Capture and summarize interaction data via LLM
2. edit_interaction    - Modify existing logged interactions
3. get_hcp_history     - Retrieve past interactions for an HCP
4. suggest_follow_ups  - AI-powered next-step recommendations
5. analyze_sentiment   - Infer HCP sentiment from conversation notes
"""

import os
import json
from typing import Annotated, TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode
import asyncio

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_api_key_here")
PRIMARY_MODEL = "llama-3.3-70b-versatile"

# --- State ---

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    interaction_data: dict
    hcp_id: Optional[int]
    session_context: dict

# --- Tool Definitions ---

@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    topics_discussed: str,
    date: str,
    time: str,
    attendees: List[str],
    materials_shared: List[str],
    samples_distributed: List[str],
    outcomes: str,
    follow_up_actions: str,
    raw_notes: str = ""
) -> dict:
    """Logs a new HCP interaction and returns structured data."""
    llm = ChatGroq(api_key=GROQ_API_KEY, model=PRIMARY_MODEL)

    prompt = f"""You are a life sciences CRM assistant. Analyze this HCP interaction and return ONLY valid JSON.

HCP: {hcp_name}
Type: {interaction_type}
Date: {date} {time}
Topics: {topics_discussed}
Raw Notes: {raw_notes}
Outcomes: {outcomes}
Follow-ups: {follow_up_actions}

Return JSON with keys:
- summary: 2-3 sentence summary
- entities: list of drug names, clinical terms mentioned
- sentiment: one of Positive/Neutral/Negative
- suggested_follow_ups: list of 2-3 actionable next steps
- key_outcomes: bullet list string"""

    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        ai_data = json.loads(response.content)
    except Exception:
        ai_data = {
            "summary": response.content,
            "entities": [],
            "sentiment": "Neutral",
            "suggested_follow_ups": [],
            "key_outcomes": outcomes
        }

    return {
        "hcp_name": hcp_name,
        "interaction_type": interaction_type,
        "interaction_date": f"{date}T{time}",
        "attendees": attendees,
        "topics_discussed": topics_discussed,
        "materials_shared": materials_shared,
        "samples_distributed": samples_distributed,
        "sentiment": ai_data.get("sentiment", "Neutral"),
        "outcomes": outcomes,
        "follow_up_actions": follow_up_actions,
        "ai_summary": ai_data.get("summary", ""),
        "ai_suggested_follow_ups": ai_data.get("suggested_follow_ups", []),
        "ai_entities": ai_data.get("entities", [])
    }


@tool
def edit_interaction(
    interaction_id: str,
    field: str,
    new_value: str
) -> dict:
    """Modifies a specific field of an existing logged interaction."""
    interaction_id = int(interaction_id)
    allowed_fields = [
        "topics_discussed", "outcomes", "follow_up_actions",
        "sentiment", "materials_shared", "samples_distributed", "attendees"
    ]
    if field not in allowed_fields:
        return {"error": f"Field '{field}' is not editable. Allowed: {allowed_fields}"}

    return {
        "status": "edit_queued",
        "interaction_id": interaction_id,
        "field": field,
        "new_value": new_value,
        "message": f"Interaction #{interaction_id} field '{field}' will be updated."
    }


@tool
def get_hcp_history(hcp_name: str, limit: str = "5") -> dict:
    """Retrieves the last N interactions logged for a given HCP."""
    limit = int(limit)
    return {
        "hcp_name": hcp_name,
        "limit": limit,
        "message": f"Fetching last {limit} interactions for {hcp_name}",
        "status": "history_requested"
    }


@tool
def suggest_follow_ups(
    hcp_name: str,
    last_interaction_summary: str,
    product_focus: str = ""
) -> dict:
    """Generates AI-powered follow-up suggestions for a sales rep."""
    llm = ChatGroq(api_key=GROQ_API_KEY, model=PRIMARY_MODEL)

    prompt = f"""You are a pharmaceutical sales coach. Based on this HCP interaction summary,
suggest 3-5 specific follow-up actions a medical rep should take within the next 2 weeks.

HCP: {hcp_name}
Last Interaction: {last_interaction_summary}
Product Focus: {product_focus}

Return ONLY a JSON array of objects, each with: action, priority (High/Medium/Low), timeframe (e.g., '3 days', '1 week')"""

    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        suggestions = json.loads(response.content)
    except Exception:
        suggestions = [{"action": response.content, "priority": "Medium", "timeframe": "1 week"}]

    return {
        "hcp_name": hcp_name,
        "follow_up_suggestions": suggestions,
        "generated_by": "AI"
    }


@tool
def analyze_sentiment(interaction_notes: str, hcp_name: str) -> dict:
    """Analyzes the sentiment and engagement level of an HCP from interaction notes."""
    llm = ChatGroq(api_key=GROQ_API_KEY, model=PRIMARY_MODEL)

    prompt = f"""Analyze the sentiment of this HCP interaction for a pharmaceutical sales CRM.

HCP: {hcp_name}
Notes: {interaction_notes}

Return ONLY valid JSON with:
- sentiment: Positive / Neutral / Negative
- confidence: 0.0 to 1.0
- key_concerns: list of concerns or objections
- interest_level: High / Medium / Low
- recommended_approach: one sentence for next visit strategy"""

    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        result = json.loads(response.content)
    except Exception:
        result = {
            "sentiment": "Neutral",
            "confidence": 0.5,
            "key_concerns": [],
            "interest_level": "Medium",
            "recommended_approach": "Continue relationship building."
        }

    return result


# --- Agent Graph ---

tools = [log_interaction, edit_interaction, get_hcp_history, suggest_follow_ups, analyze_sentiment]
tool_node = ToolNode(tools)

def create_agent():
    llm = ChatGroq(api_key=GROQ_API_KEY, model=PRIMARY_MODEL).bind_tools(tools)

    def agent_node(state: AgentState):
        messages = state["messages"]
        last = messages[-1]

        # If last message is a tool result, summarize and stop
        if hasattr(last, "type") and last.type == "tool":
            system_msg = SystemMessage(content="""You are an AI assistant for a pharmaceutical CRM system.
A tool has just returned results. Summarize the result clearly for the user in 2-3 sentences.
Do NOT call any more tools. Just respond with a friendly summary.""")
            response = llm.invoke([system_msg] + messages)
            # Force remove tool_calls to stop looping
            response.tool_calls = []
            return {"messages": [response]}

        system_msg = SystemMessage(content="""You are an AI assistant for a pharmaceutical CRM system.
You help medical sales representatives log and manage their HCP interactions.

Available tools:
- log_interaction: Log a new HCP visit, call, or meeting
- edit_interaction: Modify an existing interaction record
- get_hcp_history: Retrieve past interactions for an HCP
- suggest_follow_ups: Generate AI follow-up recommendations
- analyze_sentiment: Analyze HCP sentiment from notes

Call ONE tool only. After the tool returns, summarize the result. Do not call tools again.""")

        response = llm.invoke([system_msg] + messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls and len(last.tool_calls) > 0:
            return "tools"
        return END

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent