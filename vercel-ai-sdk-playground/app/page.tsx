'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function Page() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi! I am your Gemini assistant.' }],
      },
    ],
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col p-6">
      <h1 className="text-2xl font-bold">Gemini Chat</h1>

      <div className="mt-6 flex-1 rounded-xl border p-4">
        {messages.map((m) => (
          <div key={m.id} className="mb-4">
            <div className="text-sm font-semibold">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </div>

            <div className="mt-1 rounded-lg bg-muted p-3">
              {m.parts.map((part, i) =>
                part.type === 'text' ? <p key={i}>{part.text}</p> : null
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="mt-2 text-sm text-red-500">{error.message}</p> : null}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="flex-1 rounded-md border px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
        />
        <button
          className="rounded-md border px-4 py-2"
          type="submit"
          disabled={isBusy}
        >
          {isBusy ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  );
}