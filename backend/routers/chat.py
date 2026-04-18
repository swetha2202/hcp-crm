from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage
from agents.hcp_agent import get_agent
import json
import traceback

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

        result = await agent.ainvoke(state, config={"recursion_limit": 10})

        last_message = result["messages"][-1]
        response_text = last_message.content if hasattr(last_message, "content") else str(last_message)

        tool_calls = []
        interaction_data = None

        for msg in result["messages"]:
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tool_calls.append({
                        "tool": tc["name"],
                        "args": tc["args"]
                    })

        return ChatResponse(
            response=response_text,
            tool_calls=tool_calls,
            interaction_data=interaction_data
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))