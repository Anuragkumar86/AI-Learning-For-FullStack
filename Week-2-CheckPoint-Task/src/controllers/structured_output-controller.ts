import { Request, Response } from "express";
import { structuredOutput } from "../AI_Services/structured_output";

export async function StructuredOutput(req: Request, res: Response) {
    const prompt = `Extract the user profile information from the following text and return it as a structured JSON object matching the requested schema.

    Text to extract from:
    "Hey! Met this amazing developer today named Anurag Ahir. You can reach him at rahul.sharma@techcorp.dev. He currently works as an professor at TechCorp, where he earns an annual salary of 12000.`


    try {

        const response = await structuredOutput(prompt)
        console.log("RESPONSE IN CONTROLLER: ", response)
        res.status(200).json({
            success: true,
            data: response
        });
    }
    catch (err :any) {
        console.log("Error in StructuredControllers: ", err);

        res.status(500).json({
            success: false,
            message: err?.message || "Something went wrong while extracting structured data"
        });
    }
}