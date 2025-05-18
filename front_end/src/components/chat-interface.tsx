import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Send, Mic, MicOff, StopCircle, WifiOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

// Add this type definition at the top of the file, after the Message type
type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
};

// WebSocket message types
type WebSocketMessage = {
  type:
    | "message"
    | "end_interview"
    | "feedback"
    | "connection"
    | "error"
    | "answer"
    | "start_interview";
  content?: string;
  feedback?: string;
  question?: string;
  interview_id?: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "none";
    message: string;
  }>({
    type: "none",
    message: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Speech recognition reference
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Text-to-speech setup
  const synth = window.speechSynthesis;
  const speakingRef = useRef(false);

  const validateIdValidAndWeWantToUpload = async () => {
    const respone = await fetch(
      `http://localhost:8000/interview/${interviewId}`
    );
    const data = await respone.json();
    if (!data && data.status != "RESUME_UPLOADED") {
      setStatusMessage({
        type: "error",
        message:
          "No interview session found. You are not allowed to do the interview",
      });
      navigate(`/interview/${interviewId}`);
      return false;
    }
  };

  useEffect(() => {
    validateIdValidAndWeWantToUpload();
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    if (isConnecting) return true;
    setIsConnecting(true);
    if (!interviewId) {
      setStatusMessage({
        type: "error",
        message: "No interview session found. Please upload your resume first.",
      });
      return false;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      return;
    }

    const ws = new WebSocket("ws://localhost:8000/ws/chat");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setWsConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      setStatusMessage({ type: "none", message: "" });
      // send start interview message
      const message: WebSocketMessage = {
        type: "start_interview",
        interview_id: interviewId,
      };
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.log("WebSocket is not open to send this message");
      }
    };

    ws.onmessage = (event) => {
      try {
        console.log("Received WebSocket message:", event.data);
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        switch (data.type) {
          case "message":
            if (data.content) {
              const newMessage: Message = {
                id: Date.now().toString() + "-assistant",
                role: "assistant",
                content: data.content,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, newMessage]);
              speakText(data.content);
              setIsLoading(false);
            }
            break;

          case "end_interview":
            handleEndInterview_with_feedback();
            break;

          case "feedback":
            if (data.content) {
              setFeedback(data.content);
              speakText(
                "Thank you for completing the interview. Here's your feedback: " +
                  data.content
              );
              setIsLoading(false);
            }
            break;

          case "error":
            // route to /upload page
            navigate(`/interview/${interviewId}`);
            break;

          default:
            console.log("Unknown message type:", data);
            setIsLoading(false);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setIsLoading(false);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
      setWsConnected(false);
      setReconnecting(false);

      //   Attempt to reconnect if not closed intentionally
      if (
        !interviewEnded &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        setReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          initializeWebSocket();
        }, 2000 * Math.pow(2, reconnectAttemptsRef.current)); // Exponential backoff
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setStatusMessage({
          type: "error",
          message:
            "Could not reconnect to the server. Please refresh the page.",
        });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatusMessage({
        type: "error",
        message: "There was an error with the WebSocket connection.",
      });
    };

    return true;
  };

  useEffect(() => {
    // Initialize WebSocket and speech recognition
    initializeWebSocket();

    // Initialize speech recognition
    if (typeof window !== "undefined") {
      // Browser Speech Recognition API with proper prefixing
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition || null;

      if (SpeechRecognition) {
        recognitionRef.current =
          new SpeechRecognition() as SpeechRecognitionType;
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = (event) => {
          const transcript =
            event.results[event.results.length - 1][0].transcript;
          setInput((prev) => prev + " " + transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      // Clean up
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = (text: string) => {
    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    speakingRef.current = true;
    synth.speak(utterance);

    utterance.onend = () => {
      speakingRef.current = false;
    };
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatusMessage({
        type: "error",
        message: "Speech recognition is not supported in your browser.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || isLoading || !wsConnected) return;

    // Send message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: "message",
        content: input,
        question: messages[messages.length - 1].content,
        interview_id: interviewId,
      };
      wsRef.current.send(JSON.stringify(message));
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        message:
          "Not connected to the server. Please wait for reconnection or refresh the page.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEndInterview_with_feedback = () => {
    setIsLoading(true);

    // Send end interview message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: "feedback",
        interview_id: interviewId,
      };
      wsRef.current.send(JSON.stringify(message));
      setInterviewEnded(true);
    } else {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        message:
          "Not connected to the server. Please wait for reconnection or refresh the page.",
      });
    }
  };

  const handleEndInterview = () => {
    setIsLoading(true);

    // Send end interview message via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: "end_interview",
        interview_id: interviewId,
      };
      wsRef.current.send(JSON.stringify(message));
      setInterviewEnded(true);
      const message2: WebSocketMessage = {
        type: "feedback",
        interview_id: interviewId,
      };
      wsRef.current.send(JSON.stringify(message2));
    } else {
      setIsLoading(false);
      setStatusMessage({
        type: "error",
        message:
          "Not connected to the server. Please wait for reconnection or refresh the page.",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4" id="chat-section">
      <Card className="flex flex-col h-[600px] border-none shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader className="border-b bg-white z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview Session
              </span>
              {!wsConnected && (
                <div className="ml-2 flex items-center text-red-500 text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  {reconnecting ? "Reconnecting..." : "Disconnected"}
                </div>
              )}
            </div>
            {!interviewEnded && (
              <Button
                variant="destructive"
                onClick={handleEndInterview}
                disabled={isLoading || messages.length < 2 || !wsConnected}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-none"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                End Interview
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        {statusMessage.type !== "none" && (
          <div
            className={`px-4 py-2 ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        {interviewEnded ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-center max-w-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Thank You!
              </h2>
              <p className="text-gray-600 mb-6">
                Your interview has been completed successfully. Here's your
                feedback:
              </p>

              {feedback ? (
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-left">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    Interview Feedback
                  </h3>
                  <p className="text-sm whitespace-pre-line">{feedback}</p>
                </div>
              ) : (
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Loading feedback...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <CardContent className="flex-grow overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2.5 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <Avatar
                        className={
                          message.role === "assistant"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-gray-200"
                        }
                      >
                        {message.role === "assistant" ? "AI" : "You"}
                      </Avatar>
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white border border-gray-200 shadow-sm"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2.5 max-w-[80%]">
                      <Avatar className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        AI
                      </Avatar>
                      <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                        <div className="flex space-x-2">
                          <div
                            className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            <CardFooter className="border-t p-4 bg-white">
              <div className="flex w-full items-center space-x-2">
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={toggleListening}
                  className={`flex-shrink-0 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                  disabled={!wsConnected}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                <Input
                  placeholder={
                    wsConnected
                      ? "Type your response..."
                      : "Connecting to server..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || !wsConnected}
                  className="flex-grow border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || !wsConnected}
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
