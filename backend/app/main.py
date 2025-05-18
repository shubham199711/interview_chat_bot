import json
from fastapi import FastAPI, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app import db, models, schemas, crud, google_ai
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
from dotenv import load_dotenv


load_dotenv()

models.Base.metadata.create_all(bind=db.engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def get_db():
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@app.post("/interview", response_model=schemas.InterviewOut | None)
def create_interview_api(db: Session = Depends(get_db)):
    return crud.create_interview(db)
@app.get("/interview/{interview_id}", response_model=schemas.InterviewOut | None)
def get_interview_api(interview_id: str, db: Session = Depends(get_db)):
    return crud.get_interview(db, interview_id)

@app.post("/upload_resume/{interview_id}", response_model=schemas.InterviewOut | None)
async def upload_resume(interview_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text()

    return crud.update_resume(db, interview_id, text)

@app.websocket("/ws/chat")
async def interview_websocket(websocket: WebSocket):
    try:
        await websocket.accept()
    except Exception as e:
        print("error on accept", e)
        return
    try:
        db_session = db.SessionLocal()
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            print("Message received 2:", data)

            if data["type"] == "start_interview":
                interview_id = data["interview_id"]
                interview = db_session.query(models.Interview).filter(models.Interview.id == interview_id).first()
                if not interview_id or not interview:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid question ID"}))
                    continue

                if str(interview.status) != "RESUME_UPLOADED":
                    await websocket.send_text(json.dumps({"type": "error", "message": "Resume not uploaded yet"}))
                    continue
                # remove previous question
                crud.delete_interview_questions(db_session, interview_id)
                prompt = f"Resume: {interview.resume_text}\nPrevious QnA: []\nNext question? just keep the question short in 3-5 lines max."
                question_text = google_ai.get_completion(prompt)
                print(f"First question: {question_text}")
                await websocket.send_text(json.dumps({"type": "message", "content": question_text}))
            elif data["type"] == "message":
                interview_id = data["interview_id"]
                question = data["question"]
                answer = data["content"]
                if not interview_id:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid question ID"}))
                    continue
                crud.add_question(db_session, interview_id, question, answer)
                all_question_answer = crud.get_all_questions(db_session, interview_id)
                list_of_questions = list(map(lambda x: f"question: {x.question}, answer: {x.answer}", all_question_answer))
                if len(list_of_questions) == 3:
                    interview = db_session.query(models.Interview).filter(models.Interview.id == interview_id).first()
                    await websocket.send_text(json.dumps({"type": "end_interview", "message": "Interview is completed"}))
                    interview.status = "CHATBOT_INTERVIEW_DONE"
                    db_session.commit()
                    continue

                prompt = f"Resume: {interview.resume_text}\nPrevious QnA: [{"\n".join(list_of_questions)}]\nNext question? just keep the question short in 3-5 lines max."
                question_text = google_ai.get_completion(prompt)
                print(f"previous question: {question}, and answer: {answer}")
                await websocket.send_text(json.dumps({"type": "message", "content": question_text}))
            elif data["type"] == "end_interview":
                interview_id = data["interview_id"]
                interview = db_session.query(models.Interview).filter(models.Interview.id == interview_id).first()
                if not interview:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid question ID"}))
                    continue
                interview.status = "CHATBOT_INTERVIEW_DONE"
                db_session.commit()
            elif data["type"] == "feedback":
                interview_id = data["interview_id"]
                if not interview_id:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Invalid question ID"}))
                    continue
                all_question_answer = crud.get_all_questions(db_session, interview_id)
                list_of_questions = list(map(lambda x: f"question: {x.question}, answer: {x.answer}", all_question_answer))
                prompt = f"Previous QnA: [{"\n".join(list_of_questions)}]\n based on this provide feedback for the candidate. Just keep the feedback short in 3-5 lines max."
                question_text = google_ai.get_completion(prompt)
                print(f"previous question: {question}, and answer: {answer}")
                await websocket.send_text(json.dumps({"type": "feedback", "content": question_text}))
                
    except WebSocketDisconnect as e:
        print("Client disconnected", e)
    except Exception as e:
        print(e)
    finally:
        print("Closing db session, connection closed")
        if db_session:
            db_session.close()