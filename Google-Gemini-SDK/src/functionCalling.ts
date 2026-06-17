import dotenv from "dotenv";
dotenv.config();

import {
    GoogleGenAI,
    FunctionCallingConfigMode,
} from "@google/genai";

import { orders } from "./database.js";

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY!;

async function getOrderStatus(
    orderId: string
) {
    return orders[
        orderId as keyof typeof orders
    ];
}

async function main() {
    const ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY,
    });

    const response =
        await ai.models.generateContent({
            model: "gemini-2.5-flash",

            contents:
                "Where is my order 1002?",

            config: {
                toolConfig: {
                    functionCallingConfig: {
                        mode:
                            FunctionCallingConfigMode.ANY,

                        allowedFunctionNames: [
                            "getOrderStatus",
                        ],
                    },
                },

                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: "getOrderStatus",

                                description:
                                    "Get order status by order ID",

                                parametersJsonSchema: {
                                    type: "object",

                                    properties: {
                                        orderId: {
                                            type: "string",
                                        },
                                    },

                                    required: [
                                        "orderId",
                                    ],
                                },
                            },
                        ],
                    },
                ],
            },
        });

    console.log(
        "Function Call Requested:"
    );

    console.log(response.functionCalls);

    // --------------------------------------------------------------------------

    const functionCall = response.functionCalls?.[0];

    if (functionCall?.name === "getOrderStatus") {
        const result = await getOrderStatus(functionCall.args?.orderId as string);

        const finalResponse =
            await ai.models.generateContent({
                model: "gemini-2.5-flash",

                contents: `
      User asked:
      Where is my order 1001? Provide all detail with my name. Also use beutiful greeting based on order status.

      Function Result:
      ${JSON.stringify(result)}
    `,
            });

        console.log(finalResponse.text);

        // console.log(result);
    }
    // ---------------------------------------------------------



}

main();