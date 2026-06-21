import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { dataSchema, DataReturn } from "../Schema/schema"
import { GeminiRetry } from "./retry_logic";

export const structuredOutput = async (prompt: string): Promise<DataReturn | undefined> => {

    const ai = new GoogleGenAI({});

    try {

        // const countTokensResponse = await ai.models.countTokens({
        //     model: "gemini-3.5-flash",
        //     contents: prompt,
        // });
        // console.log("Token Count BEFORE Response: ", countTokensResponse.totalTokens);

        const response = await GeminiRetry(
            () => ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseJsonSchema: z.toJSONSchema(dataSchema)
                },
            }),
            { maxRetries: 5, initialDelayMs: 2000 }
        );

        const data = dataSchema.parse(JSON.parse(response.text!));
        console.log("Token Count AFTER Response: ", response.usageMetadata);
        return data as DataReturn
    }
    catch (err) {
        console.log("Error in AI-Service: ", err);
        throw err

    }
}