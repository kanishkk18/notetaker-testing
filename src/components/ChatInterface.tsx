'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage, TranscriptSegment } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  meetingId: string;
  initialMessages: ChatMessage[];
  transcript: TranscriptSegment[];
  summary?: string;
  disabled?: boolean;
}

export function ChatInterface({
  meetingId,
  initialMessages,
  disabled,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically add user message
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: userMessage, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.answer,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              AI chat will be available once the meeting summary is generated
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium mb-2">Ask me anything about this meeting</p>
                <p className="text-sm">Try: "What were the main decisions?" or "Summarize action items"</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className={message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}>
                  <AvatarFallback>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <Avatar className="bg-green-100">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-gray-100 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex gap-2">
          <Input
            placeholder="Ask about the meeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}