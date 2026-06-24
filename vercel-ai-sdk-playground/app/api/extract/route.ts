import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { ResumeSchema } from '@/lib/schemas';

export async function POST(req: Request) {
    const { text } = await req.json();

    try {

        const result = await generateText({
            model: google('gemini-2.5-flash'),
            prompt: `
Extract the information.

IMPORTANT:
If a field is not explicitly mentioned,
return null.
Do not guess.
Do not invent values.

Resume:
${text}
`,
            output: Output.object({
                schema: ResumeSchema,
            }),
        });

        console.log("Structured Output Wala: ", result)

        const validate = ResumeSchema.parse(result.output)

        return Response.json(validate);
    }
    catch (err) {
        console.log("Error: ", err);
        return Response.json(err);

    }
}