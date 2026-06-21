import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const model = "gemini-2.5-flash-lite";

// If the prompt gets bigger than this, we compress older history.
const MAX_INPUT_TOKENS = 250;

// How many recent raw messages we want to keep.
const KEEP_LAST_MESSAGES = 3;

// This holds the long-term compressed memory.
let conversationSummary = "";

// This holds the recent raw conversation.
const history = [
  {
    role: "user",
    parts: [
      {
        text: "You are a helpful coding tutor. Be practical, clear, and concise.",
      },
    ],
  },
  {
    role: "model",
    parts: [{ text: "Understood." }],
  },
];

function messageToText(message) {
  return message.parts.map((part) => part.text ?? "").join(" ").trim();
}

function stringifyMessages(messages) {
  return messages
    .map((message) => `${message.role.toUpperCase()}: ${messageToText(message)}`)
    .join("\n");
}

function buildContents() {
  const memoryBlock = conversationSummary
    ? [
        {
          role: "user",
          parts: [
            {
              text:
                `Conversation summary so far:\n${conversationSummary}\n\n` +
                "Use this summary as background memory for the conversation.",
            },
          ],
        },
      ]
    : [];

  return [...memoryBlock, ...history];
}

async function countPromptTokens(contents) {
  const response = await ai.models.countTokens({
    model,
    contents,
  });

  return response.totalTokens;
}

async function summarizeOlderMessages(olderMessages) {
  const transcript = stringifyMessages(olderMessages);

  const response = await ai.models.generateContent({
    model,
    contents:
      "Summarize this conversation in 5 to 8 short bullet points. " +
      "Keep names, preferences, important facts, decisions, and open tasks. " +
      "Do not invent anything.\n\n" +
      transcript,
    config: {
      systemInstruction: "You are a memory compressor for a chat app.",
    },
  });

  console.log("SUMMARY CREATED!");
  return response.text?.trim() ?? "";

}

async function maybeCompressMemory() {
  const currentContents = buildContents();
  const currentTokenCount = await countPromptTokens(currentContents);

  // If we are still comfortably small, do nothing.
  if (currentTokenCount <= MAX_INPUT_TOKENS) {
    return currentTokenCount;
  }

  // Split history into older part and recent part.
  const recentMessages = history.slice(-KEEP_LAST_MESSAGES);
  const olderMessages = history.slice(0, Math.max(0, history.length - KEEP_LAST_MESSAGES));

  console.log("History size before:",history.length);
  if (olderMessages.length === 0) {
    return currentTokenCount;
  }


  // Summarize the old part.
  const newSummary = await summarizeOlderMessages(olderMessages);

  // Merge the new summary with the existing summary.
  conversationSummary = conversationSummary
    ? `${conversationSummary}\n${newSummary}`
    : newSummary;

  // Keep only the recent raw messages.
  history.length = 0;
  history.push(...recentMessages);

  // Recount after compression.
  const compressedContents = buildContents();
  const compressedTokenCount = await countPromptTokens(compressedContents);

  console.log("History size after:",history.length);
  return compressedTokenCount;
}

async function sendMessage(userText) {
  history.push({
    role: "user",
    parts: [{ text: userText }],
  });

  const tokenCountBeforeSend = await maybeCompressMemory();
  console.log(`[token check] prompt tokens before send: ${tokenCountBeforeSend}`);

  const contents = buildContents();

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: "You are a helpful coding tutor. Answer naturally and clearly.",
    },
  });

  const reply = response.text?.trim() ?? "";
  console.log(`Gemini: ${reply}\n`);

  history.push({
    role: "model",
    parts: [{ text: reply }],
  });

  if (response.usageMetadata) {
    console.log("[usage]", response.usageMetadata);
  }
}

async function main() {
  const rl = readline.createInterface({
    input,
    output,
  });

  console.log("Gemini memory demo started.");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const userText = await rl.question("You: ");
    const message = userText.trim();

    if (!message) continue;
    if (message.toLowerCase() === "exit") break;

    await sendMessage(message);
  }

  rl.close();
}

main().catch((err) => {
  console.error("Chat failed:", err);
  process.exit(1);
});