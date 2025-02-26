import { z } from "zod";
import { phoneSchema } from "./phone.schema.js";

const deliveryPartnerSchema = z.object({
  phone: phoneSchema,
  availability: z.boolean({
    required_error: "Availability is required.",
    invalid_type_error: "Availability must be a boolean.",
  }),
  vehicleType: z.enum(["BIKE", "CYCLE"], {
    required_error: "Vehicle type is required. Must be one of BIKE, CYCLE.",
  }),
});

export { deliveryPartnerSchema };
