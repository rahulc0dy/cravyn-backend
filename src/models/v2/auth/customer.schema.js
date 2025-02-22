import { z } from "zod";
import { phoneSchema } from "./phone.schema";

const customerSchema = z.object({
  phone: phoneSchema,
  dateOfBirth: z
    .string({ required_error: "Date of birth is required." })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Invalid date format. Use DD-MM-YYYY."),
});

export { customerSchema };
