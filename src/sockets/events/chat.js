import { SOCKET_EVENTS } from "../../constants/socketEvents.js";
import logger from "../../utils/shared/logger.js";
import {
  joinChat,
  leaveChat,
  sendMessage,
  typing,
  getChatMessages,
} from "../../controllers/v2/chat.controller.js";

export default function registerChatEvents(socket, io) {
  // Send message with error handling
  socket.on(SOCKET_EVENTS.CHAT.SEND_MESSAGE, async (data) => {
    try {
      const message = await sendMessage(data);
      io.to(data.chatId).emit(SOCKET_EVENTS.CHAT.RECEIVE_MESSAGE, message);
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      socket.emit(SOCKET_EVENTS.CHAT.ERROR, {
        error: "Could not send message",
      });
    }
  });

  // Typing indicator
  socket.on(SOCKET_EVENTS.CHAT.TYPING, (data) => {
    try {
      if (!data.chatId || !data.username) {
        throw new Error("Chat ID or username is missing");
      }
      typing(data, socket);
    } catch (error) {
      logger.error(`Error in typing event: ${error.message}`);

      socket.emit(SOCKET_EVENTS.CHAT.ERROR, {
        error: "Could not send typing indicator",
      });
    }
  });

  // Join chat room
  socket.on(SOCKET_EVENTS.CHAT.JOIN, (data) => {
    logger.info(`User ${data.username} joined chat room ${data.chatId}`);
    joinChat(data, socket);
  });

  // Leave chat room
  socket.on(SOCKET_EVENTS.CHAT.LEAVE, (data) => {
    logger.info(`User ${data.username} left chat room ${data.chatId}`);
    leaveChat(data, socket);
  });

  // Get chat history
  socket.on(SOCKET_EVENTS.CHAT.FETCH_HISTORY, async ({ chatId }) => {
    try {
      const messages = await getChatMessages(chatId);
      socket.emit(SOCKET_EVENTS.CHAT.HISTORY, { chatId, messages });
    } catch (error) {
      logger.error(`Error fetching chat history: ${error.message}`);
      socket.emit(SOCKET_EVENTS.CHAT.ERROR, {
        error: "Could not fetch chat history",
      });
    }
  });
}
