import { useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, SmileIcon, Send } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  role: "system" | "proponent" | "rec-chair";
  message: string;
  timestamp: string;
}

// Empty message array - will be populated with real data from Firebase
const initialMessages: Message[] = [];

export function MessageSection() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const currentUserRole = "proponent"; // This would normally come from auth context

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add new message to the conversation
    const newMessage: Message = {
      id: messages.length + 1,
      sender: "Angel Peralta",
      role: "proponent",
      message: message.trim(),
      timestamp: new Date().toLocaleString(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const isCurrentUser = (role: string) => role === currentUserRole;

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold text-green-800">
          Message
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Message History */}
        <div className="p-6 rounded-md border border-gray-100 p-4 bg-gray-50">
          <div className="space-y-4  overflow-y-auto h-[340px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-2 max-w-[80%] ${
                    msg.role === "system"
                      ? "mx-auto"
                      : isCurrentUser(msg.role)
                      ? "ml-auto"
                      : "mr-auto"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      isCurrentUser(msg.role) ? "justify-end" : "justify-start"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        msg.role === "system"
                          ? "text-green-700"
                          : msg.role === "rec-chair"
                          ? "text-blue-700"
                          : "text-purple-700"
                      }`}
                    >
                      {msg.sender}
                    </p>
                    <p className="text-xs text-gray-500">{msg.timestamp}</p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.role === "system"
                        ? "bg-white border border-gray-100"
                        : isCurrentUser(msg.role)
                        ? "bg-green-600 text-white ml-auto rounded-br-none"
                        : "bg-gray-100 mr-auto rounded-bl-none"
                    }`}
                  >
                    <p
                      className={`${
                        msg.role === "system"
                          ? "text-gray-700"
                          : isCurrentUser(msg.role)
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t bg-gray-50 p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50 w-full">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="sr-only">Upload image</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <SmileIcon className="h-5 w-5" />
                <span className="sr-only">Add emoji</span>
              </Button>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                className="mx-4 min-h-[40px] max-h-[40px] py-2 resize-none border-gray-300 focus:ring-green-500 focus:border-green-500 bg-white"
                rows={1}
              />

              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="text-green-600 hover:bg-green-100"
              >
                <Send className="h-5 w-5 rotate-90" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
