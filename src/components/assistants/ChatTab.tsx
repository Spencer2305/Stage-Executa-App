'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useUserStore } from "@/state/userStore";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | string;
}

interface ChatTabProps {
  assistantId: string;
}

export default function ChatTab({ assistantId }: ChatTabProps) {
  const { user } = useUserStore();
  const [message, setMessage] = useState("");
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollArea = document.getElementById('chat-scroll-area');
      if (scrollArea) {
        const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  // Load conversation history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem('executa-auth-token');
        if (!token) {
          // If no auth token, show welcome message
          setChatMessages([
            {
              id: "welcome",
              content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
              sender: "bot",
              timestamp: new Date()
            }
          ]);
          setIsLoadingHistory(false);
          scrollToBottom();
          return;
        }

        const response = await fetch(`/api/chat/${assistantId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            // Load existing conversation history
            setChatMessages(data.messages);
            
            // Set the thread ID from the most recent conversation
            if (data.threadId) {
              setChatThreadId(data.threadId);
            }
            
            // Scroll to bottom after loading history
            scrollToBottom();
          } else {
            // No history found, show welcome message
            setChatMessages([
              {
                id: "welcome",
                content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
                sender: "bot",
                timestamp: new Date()
              }
            ]);
            scrollToBottom();
          }
        } else {
          // Error loading history, show welcome message
          setChatMessages([
            {
              id: "welcome",
              content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
              sender: "bot",
              timestamp: new Date()
            }
          ]);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Show welcome message on error
        setChatMessages([
          {
            id: "welcome",
            content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
            sender: "bot",
            timestamp: new Date()
          }
        ]);
        scrollToBottom();
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [assistantId]);

  // Generate session ID and user identifier on component mount
  useEffect(() => {
    // Generate a unique session ID for this chat session
    const newSessionId = `chat-tab-${assistantId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Use user from store if available, otherwise generate test user identifier
    if (user?.id) {
      setUserIdentifier(user.id);
    } else {
      // Try to get user ID from localStorage or generate a test user identifier
      const authToken = localStorage.getItem('executa-auth-token');
      if (authToken) {
        try {
          // Decode the token to get user info (this is a simple approach)
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          setUserIdentifier(payload.userId || payload.id || `test-user-${Date.now()}`);
        } catch (e) {
          // If token parsing fails, generate a test user ID
          setUserIdentifier(`test-user-${Date.now()}`);
        }
      } else {
        setUserIdentifier(`test-user-${Date.now()}`);
      }
    }
  }, [assistantId, user?.id]);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    
    // Scroll to bottom after user message
    scrollToBottom();

    try {
      // Call real AI assistant API
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/chat/${assistantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentMessage,
          threadId: chatThreadId,
          sessionId: sessionId,
          userIdentifier: userIdentifier
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update thread ID if this is the first message
      if (data.threadId && !chatThreadId) {
        setChatThreadId(data.threadId);
      }

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
      
      // Scroll to bottom after receiving response
      scrollToBottom();

    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
      
      // Scroll to bottom after error message
      scrollToBottom();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Your Assistant</CardTitle>
        <CardDescription>
          Chat with your assistant and see your complete conversation history. All messages are saved and contribute to your analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-96 border rounded-lg p-4" id="chat-scroll-area">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading chat history...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No conversation history yet.</p>
                    <p className="text-xs mt-1">Start a conversation below!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 