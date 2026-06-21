import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// The SDK chat helper stores the conversation history for you.
const chat = ai.chats.create({
  model: MODEL,
});

async function main() {
  const rl = readline.createInterface({
    input,
    output,
  });

  console.log("SDK Gemini chat started.");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const userText = await rl.question("You: ");
    const message = userText.trim();

    if (!message) continue;
    if (message.toLowerCase() === "exit") break;

    const response = await chat.sendMessage({
      message,
    });

    console.log(`Gemini: ${response.text}\n`);

    // Optional: inspect token usage
    if (response.usageMetadata) {
      console.log("Usage metadata:", response.usageMetadata);
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error("Chat failed:", err.message);
  process.exit(1);
});