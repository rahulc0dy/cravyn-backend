import { configDotenv } from "dotenv";
import { neon } from "@neondatabase/serverless";

configDotenv();

const sql = neon(process.env.DATABASE_URL);

export { sql };
