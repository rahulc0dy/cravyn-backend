import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(
    [
      "CUSTOMER",
      "DELIVERY_PARTNER",
      "RESTAURANT_OWNER",
      "RESTAURANT_TEAM",
      "MANAGEMENT",
      "BUSINESS",
    ],
    {
      required_error:
        "Role is required. Must be one of CUSTOMER, DELIVERY_PARTNER, RESTAURANT_OWNER, RESTAURANT_TEAM, MANAGEMENT, BUSINESS.",
    }
  ),
});

export { roleSchema };
