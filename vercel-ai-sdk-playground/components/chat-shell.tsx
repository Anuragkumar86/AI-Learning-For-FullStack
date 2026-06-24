'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChatShell() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Ask me anything about React, AI, or Gemini.' }],
      },
    ],
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <Card className="mx-auto mt-8 flex h-[80vh] w-full max-w-3xl flex-col">
      <CardHeader>
        <CardTitle>Streaming Chat UI</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <ScrollArea className="flex-1 rounded-md border p-4">
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className="inline-block max-w-[85%] rounded-2xl bg-muted px-4 py-2">
                  {m.parts.map((part, idx) =>
                    part.type === 'text' ? <p key={idx}>{part.text}</p> : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput('');
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <Button type="submit" disabled={isBusy}>
            {isBusy ? 'Thinking...' : 'Send'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}