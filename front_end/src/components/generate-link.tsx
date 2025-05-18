"use client";

import { useState } from "react";
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
import { Link, Share2, Copy, Check } from "lucide-react";

export default function GenerateLink() {
  const [interviewLink, setInterviewLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "none";
    message: string;
  }>({
    type: "none",
    message: "",
  });

  const generateInterviewLink = async () => {
    setIsGenerating(true);
    setStatusMessage({ type: "none", message: "" });

    try {
      const response = await fetch("http://localhost:8000/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate interview link");
      }

      const data = await response.json();

      if (data.id) {
        setInterviewLink("http://localhost:5173/interview/" + data.id);
        setStatusMessage({
          type: "success",
          message: "Interview link generated successfully!",
        });
      }
    } catch (error) {
      console.error("Error generating link:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to generate interview link. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (interviewLink) {
      navigator.clipboard.writeText(interviewLink);
      setCopied(true);
      setStatusMessage({
        type: "success",
        message: "Link copied to clipboard",
      });

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const shareLink = () => {
    if (interviewLink && navigator.share) {
      navigator
        .share({
          title: "AI Interview Link",
          text: "Join my AI interview session",
          url: interviewLink,
        })
        .then(() => {
          setStatusMessage({
            type: "success",
            message: "Link shared successfully",
          });
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div
      className="container max-w-2xl mx-auto py-10 px-4"
      id="generate-link-section"
    >
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Generate Interview Link
          </CardTitle>
          <CardDescription>
            Create a shareable link for an AI interview session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {statusMessage.type !== "none" && (
            <div
              className={`p-3 rounded-md ${
                statusMessage.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {interviewLink ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium mb-2">
                  Your Interview Link
                </h3>
                <div className="flex items-center">
                  <Input
                    value={interviewLink}
                    readOnly
                    className="pr-10 border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-[-40px]"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Share Options</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={shareLink}
                    className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all duration-300"
                  >
                    <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                    Share Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all duration-300"
                  >
                    <Copy className="mr-2 h-4 w-4 text-purple-500" />
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  How to use
                </h3>
                <p className="text-xs text-blue-700">
                  Share this link with the candidate. When they open it, they'll
                  be able to start the AI interview process immediately.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-4">
                <Link className="h-10 w-10 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">
                  No Interview Link Generated
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the button below to generate a shareable interview link
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            onClick={generateInterviewLink}
            disabled={isGenerating}
          >
            {isGenerating ? (
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
                Generating...
              </>
            ) : interviewLink ? (
              "Generate New Link"
            ) : (
              <>
                <Link className="mr-2 h-5 w-5" />
                Generate Interview Link
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
