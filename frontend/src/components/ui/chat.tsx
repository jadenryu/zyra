"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Sparkles, User } from "lucide-react";
import { aiAPI } from "@/lib/api";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  datasetId?: string;
  initialMessages?: Message[];
  placeholder?: string;
}

export function Chat({
  datasetId,
  initialMessages = [],
  placeholder = "Ask a question about your data...",
  className,
  ...props
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      // Call AI API if dataset ID is provided
      if (datasetId) {
        const response = await aiAPI.getInsight(datasetId, input);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.insight || "I couldn't generate an insight for this question.",
          role: "assistant",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Mock response for testing
        setTimeout(() => {
          const mockResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: "This is a mock response since no dataset ID was provided. In a real implementation, I would analyze your data and provide insights based on your question.",
            role: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, mockResponse]);
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)} {...props}>
      <div className="flex items-center gap-3 border-b p-4">
        <Brain className="h-6 w-6 text-blue-500" />
        <div className="font-semibold">Zyra AI Assistant</div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-2 p-8 text-center">
              <Sparkles className="h-10 w-10 text-blue-500 opacity-50" />
              <h3 className="font-semibold text-xl">How can I help you?</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask me questions about your dataset, and I'll provide insights and recommendations.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start gap-3", 
                  message.role === "user" ? "justify-end" : ""
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/ai-assistant.png" alt="AI" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className="mt-1 text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/user-avatar.png" alt="User" />
                    <AvatarFallback className="bg-green-600 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
} 