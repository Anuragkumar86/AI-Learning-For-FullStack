import zod from "zod"

export const dataSchema =  zod.object({
    name: zod.string(),
    email: zod.email(),
    company: zod.string(),
    salary: zod.number(),
    age: zod.number().optional(),
    role: zod.enum(["Full-Stack", "Data-Scientist", "SDE", "Other Hai Bhai"])
})


export type Role = "Full-Stack" | "Data-Scientist" | "SDE" | "Other Hai Bhai";

export type DataReturn = {
  name: string;
  email: string;
  company: string;
  salary: number;
  age?: number; 
  role: Role;
};

