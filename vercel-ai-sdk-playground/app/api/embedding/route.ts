import { embed } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { value } = await req.json();

  const result = await embed({
    model: google.embedding('gemini-embedding-001'),
    value,
  });

  return Response.json({
    dimensions: result.embedding.length,
    embedding: result.embedding,
  });
}