import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import logger from "../utils/shared/logger.js";
import registerChatEvents from "./events/chat.js";

export const handleConnection = (socket, io) => {
  logger.info(`Socket connected: ${socket.id}`);

  registerChatEvents(socket, io);

  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
};
