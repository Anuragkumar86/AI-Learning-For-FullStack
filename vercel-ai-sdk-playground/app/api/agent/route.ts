import { generateText, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { getWeather } from '@/lib/weather-tool';

export async function POST(req: Request) {
    const { prompt } = await req.json();

    const result = await generateText({
        model: google('gemini-2.5-flash'),
        system: `
You are a helpful assistant.

Rules:
- Answer normal questions directly.
- Use getWeather only when the user asks about weather for a city.
- Do not use the weather tool for unrelated questions.
- If a question is unclear, answer naturally or ask for clarification.
`,
        prompt,
        tools: {
            getWeather,
        },
        stopWhen: stepCountIs(3),
    });

    console.dir(result, { depth: true })
    return Response.json({ text: result.text });
}