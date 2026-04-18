from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from db.database import get_db
from models.hcp import HCP

router = APIRouter()

class HCPCreate(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None

@router.post("/")
async def create_hcp(data: HCPCreate, db: AsyncSession = Depends(get_db)):
    hcp = HCP(**data.dict())
    db.add(hcp)
    await db.commit()
    await db.refresh(hcp)
    return hcp

@router.get("/")
async def list_hcps(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HCP))
    return result.scalars().all()

@router.get("/search")
async def search_hcps(q: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(HCP).where(HCP.name.ilike(f"%{q}%"))
    )
    return result.scalars().all()
