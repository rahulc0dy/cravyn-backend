import { z, ZodError } from "zod";
import { phoneSchema } from "./phone.schema.js";

const customerSchema = z.object({
  phone: phoneSchema,
  dateOfBirth: z
    .string({ required_error: "Date of birth is required." })
    .regex(/^\d{2}-\d{2}-\d{4}$/, "Invalid date format. Use DD-MM-YYYY.")
    .transform((date) => {
      const [day, month, year] = date.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const isValid =
        parsedDate.getDate() === day &&
        parsedDate.getMonth() === month - 1 &&
        parsedDate.getFullYear() === year;
      if (!isValid) {
        throw new ZodError([{ message: "Invalid date." }]);
      }
      return parsedDate;
    }),
});

export { customerSchema };
