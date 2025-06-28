import dotenv from "dotenv";
import { app } from "./app.js";
import { initSocketServer } from "./sockets/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});

initSocketServer(server);
