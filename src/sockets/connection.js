import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import logger from "../utils/shared/logger.js";

export const handleConnection = (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, (message) => {
    logger.info(`Message received: ${message.message}`);
    // Here you would typically emit the message to other connected clients
    // socket.broadcast.emit(SOCKET_EVENTS.CHAT.RECEIVE_MESSAGE, message);
  });

  socket.on(SOCKET_EVENTS.CHAT.TYPING, (data) => {
    logger.info(`User typing: ${data.username}`);
    // Here you would typically emit the typing event to other connected clients
    // socket.broadcast.emit(SOCKET_EVENTS.CHAT.TYPING, data);
  });

  // Register other events as needed

  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
};
