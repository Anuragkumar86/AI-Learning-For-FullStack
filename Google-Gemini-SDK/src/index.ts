import dotenv from "dotenv"
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("API KEY: ", GEMINI_API_KEY)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function main() {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: 'Why is the sky blue?',
    }); 

    //   console.log(response.text);

    // console.log("\nFULL RESPONSE OBJECT USING DIR❇️:");
    // console.dir(response, { depth: null });
    // console.log("-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------")

    // console.log("\nFULL RESPONSE OBJECT USING CONSOLE✅:");
    // console.dir(response, { depth: null });

    for await (const chunk of response) {
    console.log(chunk.text);
  }
}

main();