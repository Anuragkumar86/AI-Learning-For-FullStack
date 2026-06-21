import { GoogleGenAI} from "@google/genai"
import dotenv from "dotenv"

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY

const ai = new GoogleGenAI({apiKey: GEMINI_KEY})

const instructions = `
    - You are expert sentiment Analyzer
    - Analyze the sentiment of user Which he/she had given deeply
    - Provide me exact three thing from that 
    1. Sentiments(Either positive, negative, neutral) 
    2. Summary 
    3. Important Keywords
`
export async function AnalyseAI(prompt : string): Promise<string> {
  try{

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config:{
            systemInstruction: instructions
        }
      });
      return JSON.stringify({
        messagee: response.text,
        codee: 200
    })
  }
  catch(err: any){
    // console.error("Error while generating content from gemini for Analyze"+ err)
    // console.log("ERRRR", err.Api)
    return JSON.stringify({
        messagee: err.message,
        codee: 503
    })
  }

  
}

