import express from "express"
import { Analyze } from "../controllers/analyze-controllers"
import { StructuredOutput } from "../controllers/structured_output-controller"


const router =  express.Router()

router.post("/analyze", Analyze)
router.post("/extract", StructuredOutput)

export default router