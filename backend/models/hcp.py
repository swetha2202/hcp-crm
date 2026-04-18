from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base

class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    specialty = Column(String(255))
    hospital = Column(String(255))
    email = Column(String(255), unique=True)
    phone = Column(String(50))
    territory = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
