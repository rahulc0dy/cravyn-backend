import { PrismaClient } from "@prisma/client";

/*
Prisma Client
 */
export const prisma = new PrismaClient({
  log: ["info"],
  errorFormat: "pretty",
});
