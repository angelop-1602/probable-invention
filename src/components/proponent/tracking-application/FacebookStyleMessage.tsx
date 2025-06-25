"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Minus, Send, Paperclip, Smile } from "lucide-react";
import { MessageSection } from "./MessageSection";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FacebookStyleMessageProps {
  isInline?: boolean; // For title section placement
  applicationId?: string;
  currentUserRole?: "proponent" | "rec-chair";
  currentUserName?: string;
}

export function FacebookStyleMessage({ 
  isInline = false,
  applicationId = "",
  currentUserRole = "proponent",
  currentUserName = "Angel Peralta"
}: FacebookStyleMessageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isInline) {
    // Inline button for title section
    return (
      <>
        {/* Inline Message Button for Title Section */}
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary text-white flex items-center space-x-2 px-4 py-2"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Messages</span>
        </Button>

        {/* Chat Window - Always in Bottom Right */}
        {isOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            <Card 
              className={cn(
                "w-80 bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden transition-all duration-200",
                isMinimized ? "h-14" : "h-96"
              )}
            >
              {/* Header */}
              <CardHeader className="bg-primary text-white p-3 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Image src="/SPUP-Logo-with-yellow.png" alt="REC Chair" width={32} height={32} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      REC Chair
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs opacity-90">Active now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-primary"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>

              {/* Message Content */}
              {!isMinimized && (
                <CardContent className="p-0 h-[calc(384px-66px)] flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-hidden">
                    <MessageSection 
                      applicationId={applicationId}
                      currentUserRole={currentUserRole}
                      currentUserName={currentUserName}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </>
    );
  }

  // Original floating version (fallback)
  return (
    <>
      {/* Floating Message Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="relative rounded-full w-16 h-16 bg-primary hover:bg-primary shadow-lg transition-all duration-200 hover:scale-105"
            size="icon"
          >
            <MessageCircle className="h-7 w-7 text-white" />
            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </Button>
        </div>
      )}

      {/* Message Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card 
            className={cn(
              "w-80 bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden transition-all duration-200",
              isMinimized ? "h-14" : "h-96"
            )}
          >
            {/* Header */}
            <CardHeader className="bg-primary text-white p-3 flex flex-row items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Image src="/SPUP-Logo-with-yellow.png" alt="REC Chair" width={32} height={32} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    REC Chair
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs opacity-90">Active now</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-primary"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            {/* Message Content */}
            {!isMinimized && (
              <CardContent className="p-0 h-[calc(384px-66px)] flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-hidden">
                  <MessageSection 
                    applicationId={applicationId}
                    currentUserRole={currentUserRole}
                    currentUserName={currentUserName}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
} 