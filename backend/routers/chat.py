from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage
from agents.hcp_agent import get_agent
import json

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    hcp_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    tool_calls: List[dict] = []
    interaction_data: Optional[dict] = None

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        agent = get_agent()

        # Build message history
        messages = []
        for msg in request.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))

        messages.append(HumanMessage(content=request.message))

        state = {
            "messages": messages,
            "interaction_data": {},
            "hcp_id": request.hcp_id,
            "session_context": {}
        }

        result = await agent.ainvoke(state)

        # Extract response
        last_message = result["messages"][-1]
        response_text = last_message.content if hasattr(last_message, "content") else str(last_message)

        # Collect tool call data
        tool_calls = []
        interaction_data = None

        for msg in result["messages"]:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_calls.append({
                        "tool": tc["name"],
                        "args": tc["args"]
                    })

            # Check for tool results (log_interaction result)
            if hasattr(msg, "content") and isinstance(msg.content, list):
                for block in msg.content:
                    if isinstance(block, dict) and block.get("type") == "tool_result":
                        try:
                            data = json.loads(block.get("content", "{}"))
                            if "hcp_name" in data:
                                interaction_data = data
                        except Exception:
                            pass

        return ChatResponse(
            response=response_text,
            tool_calls=tool_calls,
            interaction_data=interaction_data
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
