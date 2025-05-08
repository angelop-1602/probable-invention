"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "@/lib/messaging";
import { Send, Loader2, AlertCircle, Info, PlusCircle, Search, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMessaging } from "@/lib/messaging/messaging-context";
import { useAuthContext } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ChatUIProps {
  title?: string;
  description?: string;
  emptyStateMessage?: string;
  isProponentMode?: boolean;
}

// Helper to generate contrasting gradient backgrounds for avatars
const getAvatarGradient = (name: string): string => {
  // Generate a seed based on the name
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use the seed to create a distinct gradient
  const hue1 = seed % 360;
  const hue2 = (hue1 + 40) % 360;
  
  return `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`;
};

// Safe version of useAuthContext that won't throw errors if no provider
const useSafeAuthContext = () => {
  try {
    return useAuthContext();
  } catch (error) {
    return { user: null };
  }
};

export function ChatUI({ 
  title = "Application Chat",
  description = "This is the communication between the proponent and the REC Chair.",
  emptyStateMessage = "No messages yet.",
  isProponentMode
}: ChatUIProps) {
  const [newMessage, setNewMessage] = useState("");
  const { messages, isLoading, isSending, sendMessage, applicationContext } = useMessaging();
  const { user } = useSafeAuthContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // IMPORTANT: Force proponent mode regardless of authentication state if explicitly set
  const inProponentMode = isProponentMode === true ? true : (!user?.uid);
  
  // Format timestamp
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Scroll to bottom on first load and when new messages arrive
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [isLoading, messages.length]);

  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "?";
    
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Determine if a message is from the current user or proponent
  const isCurrentUser = (senderId: string): boolean => {
    // IMPORTANT: If we're in forced proponent mode, ignore authentication
    if (inProponentMode) {
      // Check if message is from a proponent
      const isProponentMessage = senderId.startsWith('proponent-');
      return isProponentMessage;
    }
    
    // We're in REC Chair mode - use authentication
    if (user?.uid) {
      const isUser = user.uid === senderId;
      return isUser;
    }
    
    return false;
  };

  // Get display name for the message sender
  const getDisplayName = (message: Message): string => {
    const isSender = isCurrentUser(message.senderId);
    
    // If in proponent mode
    if (inProponentMode) {
      // If it's the proponent's message
      if (isSender) {
        return message.senderName || "Proponent";
      }
      
      // If it's from REC Chair
      return "REC Chair";
    } 
    // If in REC Chair mode
    else {
      // If it's the REC Chair's message
      if (isSender) {
        return "REC Chair";
      }
      
      // If it's from a proponent
      return message.senderName || "Proponent";
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      setErrorMessage(null);
      
      try {
        // Provide sender details based on the mode
        let senderDetails = undefined;
        
        // If in proponent mode, explicitly provide proponent details
        if (inProponentMode) {
          senderDetails = {
            name: "Proponent",
            role: "Proponent"
          };
        }
        
        // Send message with appropriate context
        const success = await sendMessage(newMessage, senderDetails);
        
        if (success) {
          setNewMessage("");
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          setErrorMessage("Unable to send message. The application document might not exist in the system yet.");
        }
      } catch (error) {
        setErrorMessage("Error sending message. Please try again later.");
      }
    }
  };
  
  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render a message avatar with proper styling and accessibility
  const renderAvatar = (message: Message) => {
    const displayName = getDisplayName(message);
    const initials = getInitials(displayName);
    const gradientBg = getAvatarGradient(displayName);
    
    return (
      <Avatar 
        className="h-9 w-9 flex-shrink-0"
        aria-label={`${displayName}'s avatar`}
      >
        <AvatarFallback
          style={{ background: gradientBg }}
          className="text-white font-medium"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <Separator />
      
      {/* Messages Container */}
      <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {/* Show empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{emptyStateMessage}</p>
          </div>
        )}
        
        {/* Message list */}
        {!isLoading && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div 
                key={message.id || `msg-${i}`} 
                className={cn("flex gap-3", {
                  "justify-start": !isCurrentUser(message.senderId),
                  "justify-end": isCurrentUser(message.senderId)
                })}
              >
                {/* Only show avatar for messages from others */}
                {!isCurrentUser(message.senderId) && renderAvatar(message)}
                
                <div className={cn("max-w-[75%]", {
                  "order-2": isCurrentUser(message.senderId),
                  "order-1": !isCurrentUser(message.senderId)
                })}>
                  <div className="mb-1 text-xs text-muted-foreground flex gap-1">
                    <span>{getDisplayName(message)}</span>
                    <span>·</span>
                    <span>{formatMessageTime(message.timestamp)}</span>
                  </div>
                  <div className={cn("p-3 rounded-lg", {
                    "bg-primary text-primary-foreground": isCurrentUser(message.senderId),
                    "bg-muted": !isCurrentUser(message.senderId)
                  })}>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  </div>
                </div>
                
                {/* Only show avatar for current user's messages */}
                {isCurrentUser(message.senderId) && renderAvatar(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none"
            rows={1}
            disabled={isSending}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
} 