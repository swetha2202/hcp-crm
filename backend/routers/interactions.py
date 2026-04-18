from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import List, Optional
from db.database import get_db
from models.interaction import Interaction
from models.hcp import HCP
from datetime import datetime

router = APIRouter()

class InteractionCreate(BaseModel):
    hcp_id: int
    hcp_name: str
    interaction_type: str
    interaction_date: str
    attendees: List[str] = []
    topics_discussed: str
    materials_shared: List[str] = []
    samples_distributed: List[str] = []
    sentiment: str = "Neutral"
    outcomes: str = ""
    follow_up_actions: str = ""
    ai_summary: str = ""
    ai_suggested_follow_ups: List[str] = []

class InteractionUpdate(BaseModel):
    field: str
    new_value: str

@router.post("/")
async def create_interaction(data: InteractionCreate, db: AsyncSession = Depends(get_db)):
    interaction = Interaction(
        hcp_id=data.hcp_id,
        hcp_name=data.hcp_name,
        interaction_type=data.interaction_type,
        interaction_date=datetime.fromisoformat(data.interaction_date),
        attendees=data.attendees,
        topics_discussed=data.topics_discussed,
        materials_shared=data.materials_shared,
        samples_distributed=data.samples_distributed,
        sentiment=data.sentiment,
        outcomes=data.outcomes,
        follow_up_actions=data.follow_up_actions,
        ai_summary=data.ai_summary,
        ai_suggested_follow_ups=data.ai_suggested_follow_ups,
    )
    db.add(interaction)
    await db.commit()
    await db.refresh(interaction)
    return {"id": interaction.id, "message": "Interaction logged successfully"}

@router.get("/")
async def list_interactions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Interaction).order_by(Interaction.created_at.desc()))
    interactions = result.scalars().all()
    return [
        {
            "id": i.id,
            "hcp_name": i.hcp_name,
            "interaction_type": i.interaction_type,
            "interaction_date": str(i.interaction_date),
            "sentiment": i.sentiment,
            "topics_discussed": i.topics_discussed,
            "ai_summary": i.ai_summary,
            "ai_suggested_follow_ups": i.ai_suggested_follow_ups,
            "outcomes": i.outcomes,
            "follow_up_actions": i.follow_up_actions,
            "created_at": str(i.created_at),
        }
        for i in interactions
    ]

@router.get("/{interaction_id}")
async def get_interaction(interaction_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Interaction).where(Interaction.id == interaction_id))
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction

@router.put("/{interaction_id}")
async def update_interaction(
    interaction_id: int,
    data: InteractionUpdate,
    db: AsyncSession = Depends(get_db)
):
    allowed = ["topics_discussed", "outcomes", "follow_up_actions", "sentiment", "attendees"]
    if data.field not in allowed:
        raise HTTPException(status_code=400, detail=f"Field '{data.field}' not editable")

    await db.execute(
        update(Interaction)
        .where(Interaction.id == interaction_id)
        .values({data.field: data.new_value})
    )
    await db.commit()
    return {"message": f"Interaction #{interaction_id} updated successfully"}

@router.get("/hcp/{hcp_id}")
async def get_hcp_interactions(hcp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Interaction)
        .where(Interaction.hcp_id == hcp_id)
        .order_by(Interaction.interaction_date.desc())
        .limit(10)
    )
    interactions = result.scalars().all()
    return interactions
