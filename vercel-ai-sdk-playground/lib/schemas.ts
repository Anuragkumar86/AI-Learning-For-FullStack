import { z} from "zod"

export const ResumeSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    skills: z.array(z.string()),
    role: z.string(),
    country: z.string()
})