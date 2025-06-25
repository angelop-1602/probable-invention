import { useState, FormEvent, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: string;
  role: "system" | "proponent" | "rec-chair";
  message: string;
  timestamp: any;
  applicationId?: string;
}

interface MessageSectionProps {
  applicationId?: string;
  currentUserRole?: "proponent" | "rec-chair";
  currentUserName?: string;
}

export function MessageSection({ 
  applicationId = "",
  currentUserRole = "proponent",
  currentUserName = "Angel Peralta"
}: MessageSectionProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time message loading from Firebase
  useEffect(() => {
    if (!applicationId) return;

    const messagesRef = collection(db, "submissions", applicationId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [applicationId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !applicationId) return;

    setIsLoading(true);
    try {
      // Add message to Firebase
      const messagesRef = collection(db, "submissions", applicationId, "messages");
      await addDoc(messagesRef, {
        sender: currentUserName,
        role: currentUserRole,
        message: message.trim(),
        timestamp: serverTimestamp(),
        applicationId: applicationId
      });

      setMessage("");
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };

  const isCurrentUser = (role: string) => role === currentUserRole;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start a conversation with the REC Chair</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser(msg.role) ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] space-y-1 ${
                      isCurrentUser(msg.role) ? "text-right" : "text-left"
                    }`}
                  >
                    {/* Sender and timestamp */}
                    <div
                      className={`flex items-center gap-2 text-[0.8rem] text-gray-500 ${
                        isCurrentUser(msg.role) ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex flex-col gap-0">
                      <span className="font-medium">
                        {msg.sender}
                      </span>
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                    </div>
                    
                    {/* Message bubble */}
                    <div
                      className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "system"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : isCurrentUser(msg.role)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-800"
                      } ${
                        isCurrentUser(msg.role) 
                          ? "rounded-br-md" 
                          : "rounded-bl-md"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-end space-x-3">
            {/* Textarea container */}
            <div className="flex-1 relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-[120px] resize-none border-gray-300 rounded-xl focus:ring-primary focus:border-primary pr-12"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              {/* Emoji button inside textarea */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Send button */}
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-white h-11 w-11 p-0 rounded-xl"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-gray-500 px-1">
            Press Enter to send • Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}

