import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const API_KEY = process.env.GEMINI_API_KEY; // coming from powershell terminal directly
const MODEL = "gemini-2.5-flash";
const MAX_MESSAGES = 10;

console.log("API KEYY: ",API_KEY)

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

// This array is YOUR memory.
// Gemini does not remember previous calls unless you send history again.
const history = [
  {
    role: "user",
    parts: [
      {
        text: "You are a helpful coding assistant. Give practical answers in simple language.",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: "Understood." }],
  },
];

function keepLastNMessages(messages, limit) {
  if (messages.length <= limit) return messages;
  return messages.slice(messages.length - limit);
}

async function callGemini(contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify({
      contents,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

function extractText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || ""
  );
}

async function main() {
  const rl = readline.createInterface({
    input,
    output,
  });

  console.log("Manual Gemini chat started.");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const userText = await rl.question("You: ");
    const message = userText.trim();

    if (!message) continue;
    if (message.toLowerCase() === "exit") break;

    // 1) Add the user's message to history
    history.push({
      role: "user",
      parts: [{ text: message }],
    });

    // 2) Keep only the last N messages
    const trimmedHistory = keepLastNMessages(history, MAX_MESSAGES);

    // 3) Send the trimmed history to Gemini
    const data = await callGemini(trimmedHistory);

    // 4) Extract the assistant reply
    const reply = extractText(data);

    // 5) Print the reply
    console.log(`Gemini: ${reply}\n`);

    // 6) Store Gemini's reply in history too
    history.push({
      role: "model",
      parts: [{ text: reply }],
    });

    // Optional: see token usage
    if (data.usageMetadata) {
      console.log("Usage metadata:", data.usageMetadata);
    }
  }
  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅")
  console.log(JSON.stringify(history, null, 3))
  console.log("✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅")

  rl.close();
}

main().catch((err) => {
  console.error("Chat failed:", err.message);
  process.exit(1);
});