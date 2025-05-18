from pydantic import BaseModel
from typing import Optional, List

class InterviewCreate(BaseModel):
    pass

class InterviewOut(BaseModel):
    id: str
    status: str
    class Config:
        from_attributes = True

class ResumeUpload(BaseModel):
    resume_text: str

class QuestionOut(BaseModel):
    id: str
    question: str
    answer: Optional[str]