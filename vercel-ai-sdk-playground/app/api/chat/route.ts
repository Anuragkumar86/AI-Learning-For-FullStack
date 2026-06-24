import { convertToModelMessages, streamText, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    system: 'You are a helpful assistant. Keep answers simple and clear.',
  });

  return result.toUIMessageStreamResponse();
}