# 🧠 AI Interview Chatbot

This project is a chatbot-based interview platform powered by Google Gemini AI. It consists of a **React frontend**, a **FastAPI backend**, and a **PostgreSQL** database. Everything is containerized using **Docker Compose** for easy setup.

---

## 🚀 Features

- Conversational interview experience powered by Google Gemini AI
- Persistent storage using PostgreSQL
- Clean separation of frontend (React) and backend (FastAPI)
- Easy setup with Docker Compose

---

## 🧰 Requirements

- [Docker](https://www.docker.com/)
- A valid **Google Gemini API Key**

---

## 🔑 Environment Variable

Before running the project, create a `.env` file in the root in backend directory (or use your preferred method of setting environment variables) and add your Gemini API key:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

🏁 Getting Started
Clone the repository and navigate to the project directory:
```sh
docker compose up
```

| Service  | Port | Description       |
| -------- | ---- | ----------------- |
| Frontend | 5173 | React Application |
| Backend  | 8000 | FastAPI Server    |
| Database | 5432 | PostgreSQL        |


I am using google gemini API for AI interviewer. I have used chatgpt and v0.dev for front-end and backend design and a lot of debugging.

I also have code for speaking when the interviewer asks any question.
