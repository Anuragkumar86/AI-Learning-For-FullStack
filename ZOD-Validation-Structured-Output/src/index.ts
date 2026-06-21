import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";


dotenv.config();

// 1) Define the structure you want back from the model.
const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  lineTotal: z.number().optional(),
});

const invoiceSchema = z.object({
  vendor: z.string(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(), // Keep as string for easy date normalization later
  currency: z.enum(["INR", "USD", "EUR"]).optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number(),
  items: z.array(invoiceItemSchema).default([]),
});

// 2) Create the Gemini client.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// 3) Raw invoice text from OCR, email body, or PDF text extraction.
const rawInvoiceText = `
ABC Traders Pvt Ltd
Invoice No: INV-1029
Date: 12/06/2026
Bill To: Anurag Kumar

1. Notebook - 2 x 120
2. Pen Pack - 1 x 50

Subtotal: 290
Tax: 52.2
Total: 342.2
Currency: INR
`;

// 4) Prompt the model very clearly.
const prompt = `
Extract invoice details from the text below.

Rules:
- Return only the data that appears in the invoice.
- Do not guess missing values.
- Use the exact schema.
- Don't provide any markdown either in starting or end just pure json
- If a field is missing, omit it if optional.

Invoice text:
${rawInvoiceText}
`;

// 5) Call Gemini with structured output.
async function extractInvoice() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(invoiceSchema),
        temperature: 0
    },
  });
  console.log("RESPONSE: ", response)
  console.log("TEXT RETURNED BY GEMINI.......................✅✅✅✅ ", response.text)
  // 6) Gemini returns text. Parse it into JSON.
  const parsedJson = JSON.parse(response.text!);
  console.log("TEXT AFTER PARSED IN JSON......................❤️❤️❤️❤️ ")
  console.dir(parsedJson, {depth: null, color: true})

  // 7) Validate it with Zod.
  const invoice = invoiceSchema.parse(parsedJson);

  return invoice;
}

extractInvoice()
  .then((invoice) => {
    console.log("Validated invoice:", invoice);
  })
  .catch((error) => {
    console.error("Extraction failed:", error);
  });