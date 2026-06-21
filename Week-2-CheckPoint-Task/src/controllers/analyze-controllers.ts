import { Request, Response } from "express";
import { AnalyseAI } from "../AI_Services/Anlyze";

export async function Analyze(req: Request, res: Response){
    const prompt = "I wached the movie, it was completely mind blowing and full of suspense"

    if(!prompt){
        console.log("Please provide Prompt")
        res.status(400).json({
            message: "Prompt missing Please provide the valid prompt"
        })
        return;
    }

    const response = await AnalyseAI(prompt)

    const data = JSON.parse(response)

    console.log("Result of analyse route: ", data)

    res.status(data.codee).json({
        message: data.messagee,
    })
}