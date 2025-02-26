import { z } from "zod";
import { phoneSchema } from "./phone.schema.js";

const restaurantOwnerSchema = z.object({
  phone: phoneSchema,
  panNumber: z
    .string({ required_error: "PAN number is required." })
    .length(10, "PAN number must be exactly 10 characters long.")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format."),
});

export { restaurantOwnerSchema };
