import dotenv from "dotenv";
import { app } from "./app.js";
import { createSocketServer } from "./utils/v2/socketServer.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});

createSocketServer(server);
