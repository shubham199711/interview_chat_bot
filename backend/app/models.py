from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db import Base

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    status = Column(String, default="TODO")
    resume_text = Column(Text)
    questions = relationship("Question", back_populates="interview")

class Question(Base):
    __tablename__ = "questions"
    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"))
    question = Column(Text)
    answer = Column(Text)
    interview = relationship("Interview", back_populates="questions")