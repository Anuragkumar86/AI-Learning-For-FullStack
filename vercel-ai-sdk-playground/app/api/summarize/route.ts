import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { content } = await req.json();

  const result = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: `Tell me about :\n\n${content} in 200 words with doha`,
  });

  console.dir(result.text, {depth: true})
  return Response.json({ summary: result.text });
}