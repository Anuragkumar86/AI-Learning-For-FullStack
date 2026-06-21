import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.5-flash";

const PRICE_PER_1M_INPUT_TOKENS = 1.0;
const PRICE_PER_1M_OUTPUT_TOKENS = 1.0;

type LogEntry = {
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  retries: number;
  latencyMs: number;
  success: boolean;
  error?: string;
};

const LOG_FILE = path.join(process.cwd(), "gemini-usage.jsonl");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const e = error as any;
  const code = e?.status ?? e?.code ?? e?.response?.status;
  const message = String(e?.message ?? error);

  if ([429, 500, 503, 504].includes(code)) return true;

  return /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|ETIMEDOUT|ECONNRESET/i.test(message);
}

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  baseDelayMs = 500
): Promise<{ result: T; retries: number }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[retry] attempt ${attempt + 1} started`);
      const result = await fn();
      console.log(`[retry] attempt ${attempt + 1} succeeded`);
      return { result, retries: attempt };
    } catch (error) {
      lastError = error;

      console.log(`[retry] attempt ${attempt + 1} failed`);

      if (attempt === maxAttempts - 1 || !isRetryableError(error)) {
        console.log(`[retry] not retryable or max attempts reached`);
        throw error;
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 250);
      const delay = exponentialDelay + jitter;

      console.warn(
        `Gemini call failed on attempt ${attempt + 1}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICE_PER_1M_INPUT_TOKENS +
    (outputTokens / 1_000_000) * PRICE_PER_1M_OUTPUT_TOKENS
  );
}

async function logUsage(entry: LogEntry) {
  console.log(`[log] writing usage to ${LOG_FILE}`);
  await fs.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  console.log(`[log] usage written`);
}

export async function askGemini(prompt: string): Promise<string> {
  const start = Date.now();

  try {
    console.log(`[askGemini] started`);
    console.log(`[askGemini] prompt: ${prompt}`);

    console.log(`[askGemini] counting tokens...`);
    const tokenCheck = await ai.models.countTokens({
      model: MODEL,
      contents: prompt,
    });

    const inputTokens = tokenCheck.totalTokens ?? 0;
    console.log(`[askGemini] input tokens = ${inputTokens}`);

    if (inputTokens > 8_000) {
      console.log(`[askGemini] prompt too large, stopping`);
      throw new Error(`Prompt too large: ${inputTokens} tokens`);
    }

    console.log(`[askGemini] calling Gemini model...`);
    const { result: response, retries } = await withExponentialBackoff(() =>
      ai.models.generateContent({
        model: MODEL,
        contents: prompt,
      })
    );

    console.log(`[askGemini] response received`);

    const usage = response.usageMetadata;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    const totalTokens = usage?.totalTokenCount ?? inputTokens + outputTokens;

    const latencyMs = Date.now() - start;
    const estimatedCostUsd = estimateCostUsd(inputTokens, outputTokens);

    console.log(`[askGemini] output tokens = ${outputTokens}`);
    console.log(`[askGemini] total tokens = ${totalTokens}`);
    console.log(`[askGemini] estimated cost = $${estimatedCostUsd}`);
    console.log(`[askGemini] latency = ${latencyMs}ms`);

    await logUsage({
      timestamp: new Date().toISOString(),
      model: MODEL,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd,
      retries,
      latencyMs,
      success: true,
    });

    console.log(`[askGemini] done successfully`);

    return response.text ?? "";
  } catch (error) {
    const latencyMs = Date.now() - start;

    console.error(`[askGemini] failed:`, error);

    await logUsage({
      timestamp: new Date().toISOString(),
      model: MODEL,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      retries: 0,
      latencyMs,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });

    return "Sorry, I could not complete that request right now.";
  }
}

// ✅ This actually runs the function
async function main() {
  console.log(`[main] program started`);

  const result = await askGemini("Explain exponential backoff in simple words.");

  console.log(`[main] final result:`);
  console.log(result);

  console.log(`[main] program finished`);
}

main().catch((error) => {
  console.error(`[main] unhandled error:`, error);
});