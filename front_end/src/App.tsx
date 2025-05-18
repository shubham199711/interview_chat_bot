import "./App.css";
import ChatInterface from "./components/chat-interface";
import GenerateLink from "./components/generate-link";
import { Route, Routes } from "react-router-dom";
import ResumeUpload from "./components/resume-upload";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GenerateLink />} />
        <Route path="/interview/:id" element={<ResumeUpload />} />
        <Route path="/chatbot/:id" element={<ChatInterface />} />
      </Routes>
    </>
  );
}

export default App;
