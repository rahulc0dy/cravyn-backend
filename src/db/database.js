/**
 * Initializes the database connection using Neon serverless and environment variables.
 *
 * This module loads environment variables from a `.env` file using the `dotenv` package
 * and creates a connection to the Neon database using the `DATABASE_URL` from the environment variables.
 *
 * @module database
 */

import { configDotenv } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load environment variables from the .env file.
configDotenv();

/* Create a connection to the Neon database using the DATABASE_URL environment variable.*/
const sql = neon(process.env.DATABASE_URL);

export { sql };
