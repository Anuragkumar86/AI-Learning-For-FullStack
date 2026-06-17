import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";

if (
  !GEMINI_API_KEY ||
  !GITHUB_PERSONAL_ACCESS_TOKEN ||
  !GITHUB_OWNER ||
  !GITHUB_REPO
) {
  throw new Error(
    "Missing required env vars. Check GEMINI_API_KEY, GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_OWNER, and GITHUB_REPO."
  );
}

function toolResultToText(result: unknown): string {
  if (!result || typeof result !== "object") {
    return String(result);
  }

  const anyResult = result as any;

  if (Array.isArray(anyResult.content)) {
    return anyResult.content
      .map((item: any) => {
        if (typeof item.text === "string") return item.text;
        return JSON.stringify(item, null, 2);
      })
      .join("\n");
  }

  return JSON.stringify(result, null, 2);
}

function makeSafeBranchName(repo: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const cleanRepo = repo.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `ai/add-readme-${cleanRepo}-${timestamp}`;
}

async function main() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // This starts the GitHub MCP server as a child process.
  // With stdio transport, the client launches the server and talks through stdin/stdout.
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN,
    },
  });

  const client = new Client({
    name: "github-readme-demo",
    version: "1.0.0",
  });

  await client.connect(transport);

  try {
    console.log("Connected to GitHub MCP server.\n");

    // Step 1: See which tools the server exposes.
    const tools = await client.listTools();
    console.log("Available MCP tools:");
    console.log(
      tools.tools.map((t: any) => `- ${t.name}`).join("\n")
    );
    console.log("");

    // Step 2: Read a little repo context.
    // package.json is a nice first source of truth if it exists.
    let packageJsonText = "";
    try {
      const packageJsonResult = await client.callTool({
        name: "get_file_contents",
        arguments: {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: "package.json",
          ref: GITHUB_BASE_BRANCH,
        },
      });

      packageJsonText = toolResultToText(packageJsonResult);
      console.log("Fetched package.json from the repository.\n");
    } catch {
      console.log(
        "No package.json found, so we will generate a generic README.\n"
      );
    }

    // Step 3: Create a new branch for the change.
    const branchName = makeSafeBranchName(GITHUB_REPO);

    const branchResult = await client.callTool({
      name: "create_branch",
      arguments: {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: branchName,
        from_branch: GITHUB_BASE_BRANCH,
      },
    });

    console.log("Created branch:");
    console.log(toolResultToText(branchResult));
    console.log("");

    // Step 4: Ask Gemini to write the README content.
    const readmePrompt = `
You are writing a README.md file for a GitHub repository.

Repository owner: ${GITHUB_OWNER}
Repository name: ${GITHUB_REPO}
Base branch: ${GITHUB_BASE_BRANCH}

${packageJsonText ? `Here is the package.json content:\n${packageJsonText}` : "No package.json content was found."}

Write a useful beginner-friendly README in Markdown.
Include:
- Project title
- Short description
- Installation
- Usage
- Scripts or project notes if they can be inferred
- A small "Next steps" or "Contributing" section

If details are missing, make sensible generic assumptions from the repository name.
Return only Markdown. No code fences. No explanation.
`.trim();

    const readmeResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: readmePrompt,
    });

    const readmeMarkdown = readmeResponse.text?.trim();

    if (!readmeMarkdown) {
      throw new Error("Gemini returned empty README content.");
    }

    console.log("Generated README.md content:\n");
    console.log(readmeMarkdown);
    console.log("");

    // Step 5: Commit README.md on the new branch.
    const writeResult = await client.callTool({
      name: "create_or_update_file",
      arguments: {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        branch: branchName,
        path: "README.md",
        content: readmeMarkdown,
        message: "Add README.md via Gemini + MCP demo",
      },
    });

    console.log("Committed README.md:");
    console.log(toolResultToText(writeResult));
    console.log("");

    // Step 6: Open a pull request.
    const prResult = await client.callTool({
      name: "create_pull_request",
      arguments: {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        title: `Add README.md for ${GITHUB_REPO}`,
        head: branchName,
        base: GITHUB_BASE_BRANCH,
        body:
          "This pull request adds a README generated with Gemini and committed through GitHub MCP.",
      },
    });

    console.log("Pull request result:");
    console.log(toolResultToText(prResult));
    console.log("");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Demo failed:");
  console.error(error);
  process.exit(1);
});