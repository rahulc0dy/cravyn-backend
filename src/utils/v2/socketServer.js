import { Server } from "socket.io";

let io;

/**
 * Initializes the Socket.io server and sets up event listeners.
 *
 * @param {import("http").Server} server - The HTTP server instance to attach the Socket.io server to.
 * @returns {import("socket.io").Server} The initialized Socket.io server instance.
 */
export const createSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  //
  // /**
  //  * Handles new client connections.
  //  *
  //  * @event connection
  //  * @param {import("socket.io").Socket} socket - The connected client socket instance.
  //  */
  // io.on("connection", (socket) => {
  //   console.log(`New client connected: ${socket.id}`);
  //
  //   /**
  //    * Handles client disconnection.
  //    *
  //    * @event disconnect
  //    */
  //   socket.on("disconnect", () => {
  //     console.log(`Client disconnected: ${socket.id}`);
  //   });
  // });

  return io;
};

/**
 * Retrieves the initialized Socket.io server instance.
 *
 * @throws {Error} If Socket.io has not been initialized before calling this function.
 * @returns {import("socket.io").Server} The existing Socket.io server instance.
 */
export const getSocketServerIo = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};
