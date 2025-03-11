import dotenv from "dotenv";
import { app, socketConnectHandler } from "./app.js";
import { Server } from "socket.io";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running at PORT: ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

io.on("connection", socketConnectHandler);
