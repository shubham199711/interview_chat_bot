"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResumeUpload() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "none";
    message: string;
  }>({
    type: "none",
    message: "",
  });
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile) {
      setStatusMessage({
        type: "error",
        message: "Please upload your resume",
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage({ type: "none", message: "" });

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      const response = await fetch(
        `http://localhost:8000/upload_resume/${interviewId}`,
        {
          method: "POST",
          body: formData,
        }
      );
      navigate("/chatbot/" + interviewId);
    } catch (error) {
      console.error("Upload error:", error);
      setStatusMessage({
        type: "error",
        message: "There was an error uploading your files. Please try again.",
      });
    } finally {
      navigate("/chatbot/" + interviewId);
      setIsUploading(false);
    }
  };

  const validateIdValidAndWeWantToUpload = async () => {
    const respone = await fetch(
      `http://localhost:8000/interview/${interviewId}`
    );
    const data = await respone.json();
    if (!data && data.status != "TODO") {
      setStatusMessage({
        type: "error",
        message:
          "No interview session found. You are not allowed to upload resume",
      });
      setIsDisabled(true);
      return false;
    }
  };

  useEffect(() => {
    validateIdValidAndWeWantToUpload();
  }, []);

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4" id="upload-section">
      <Card className="overflow-hidden border-none shadow-lg">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Start Your AI Interview
          </CardTitle>
          <CardDescription>
            Upload your resume and the job description to begin your interview
            preparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {statusMessage.type !== "none" && (
              <div
                className={`mb-4 p-3 rounded-md ${
                  statusMessage.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {statusMessage.message}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resume">Upload Resume</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:border-blue-400"
                  onClick={() => document.getElementById("resume")?.click()}
                >
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={isDisabled}
                    onChange={handleResumeChange}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-10 w-10 text-blue-500" />
                    {resumeFile ? (
                      <p className="text-sm font-medium">{resumeFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Click to upload your resume
                        </p>
                        <p className="text-xs text-gray-500">PDF</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            onClick={handleSubmit}
            disabled={isUploading || isDisabled}
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Start Interview
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
