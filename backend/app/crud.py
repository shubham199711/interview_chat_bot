import uuid
from sqlalchemy.orm import Session
from app import models, schemas
from typing import Optional

def create_interview(db: Session):
    try:
        interview = models.Interview()
        db.add(interview)
        db.commit()
        db.refresh(interview)
        return schemas.InterviewOut(
            id=str(interview.id),
            status=str(interview.status)
        )
    except Exception as e:
        print(e)
        return None

def get_interview(db: Session, interview_id: str):
    response = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not response:
        return None
    return schemas.InterviewOut(
            id=str(response.id),
            status=str(response.status)
        )

def update_resume(db: Session, interview_id: str, resume_text: str):
    interview: models.Interview | None = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        return None
    interview.resume_text = resume_text
    interview.status = "RESUME_UPLOADED"
    db.commit()
    return schemas.InterviewOut(
        id=str(interview.id),
        status=str(interview.status)
    )
    return interview

def add_question(db: Session, interview_id: str, question: str, answer: Optional[str] = ""):
    q = models.Question(interview_id=interview_id, question=question, answer=answer, id=uuid.uuid4())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

def get_all_questions(db: Session, interview_id: str):
    return db.query(models.Question).filter(models.Question.interview_id == interview_id).all()

def delete_interview_questions(db: Session, interview_id: str):
    db.query(models.Question).filter(models.Question.interview_id == interview_id).delete()
    db.commit()