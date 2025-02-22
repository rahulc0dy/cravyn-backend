import { z } from "zod";
import { ROLES } from "../../../constants/roles";

const roleSchema = z.object({
  role: z.enum(Object.values(ROLES), {
    required_error: `Role is required. Must be one of ${Object.values(ROLES).join(", ")}.`,
  }),
});

export { roleSchema };
