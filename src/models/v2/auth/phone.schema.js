import { z } from "zod";

const phoneSchema = z
  .string({
    required_error: "Phone number is required.",
    invalid_type_error: "Phone number must be a string.",
  })
  .length(10, "Phone number must be exactly 10 digits long.")
  .regex(/^\d+$/, "Phone number must contain only digits.");

export { phoneSchema };
