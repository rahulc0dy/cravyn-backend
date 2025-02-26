import { z } from "zod";

const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required." })
      .min(2, "Name must be at least 2 characters long."),
    email: z
      .string({ required_error: "Email is required." })
      .email("Invalid email address."),
    password: z
      .string({ required_error: "Password is required." })
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string({
      required_error: "Confirm password is required.",
    }),
    profileImageUrl: z.string().url("Invalid profile image URL.").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export { registerSchema };
