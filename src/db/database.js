import { configDotenv } from "dotenv";
import { neon } from "@neondatabase/serverless";

configDotenv();

const sql = neon(process.env.DATABASE_URL);

/* request handler structure */
// const requestHandler = async (req, res) => {
//   const result = await sql`SELECT version()`;
//   const { version } = result[0];
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end(version);
// };

export { sql };
