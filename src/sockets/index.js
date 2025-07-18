import { Server } from "socket.io";
import { handleConnection } from "./connection.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";

let io;

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    handleConnection(socket, io);
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
