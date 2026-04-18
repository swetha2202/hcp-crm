from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from db.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False)
    hcp_name = Column(String(255))
    interaction_type = Column(String(100))  # Meeting, Call, Email, etc.
    interaction_date = Column(DateTime(timezone=True))
    attendees = Column(JSON, default=[])
    topics_discussed = Column(Text)
    materials_shared = Column(JSON, default=[])
    samples_distributed = Column(JSON, default=[])
    sentiment = Column(String(50), default="Neutral")  # Positive, Neutral, Negative
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_summary = Column(Text)
    ai_suggested_follow_ups = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
