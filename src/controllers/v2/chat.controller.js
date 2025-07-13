import logger from "../../utils/shared/logger.js";
import { prisma } from "../../utils/v2/prismaClient.js";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";

/**
 * Send a message: saves the message and returns the message saved in the DB.
 */
export async function sendMessage({ content, messageType, senderId, chatId }) {
  const message = await prisma.message.create({
    data: { content, messageType, senderId, chatId },
    include: {
      sender: true, // adjust if needed
    },
  });
  return message;
}

/**
 * Get chat history (array of messages)
 */
export async function getChatMessages(chatId) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: true,
    },
  });
  return messages;
}

/**
 * Notify others in a chat that a user is typing.
 * (This doesn't need DB interaction; it's a passthrough for the socket event.)
 */
export function typing({ chatId, username }, socket) {
  socket.to(chatId).emit(SOCKET_EVENTS.CHAT.TYPING, { username });
}

/**
 * Add a user to a chat room.
 */
export function joinChat({ chatId, username }, socket) {
  socket.join(chatId);
  socket.to(chatId).emit(SOCKET_EVENTS.CHAT.USER_JOINED, { chatId, username });
}

/**
 * Remove a user from a chat room.
 */
export function leaveChat({ chatId, username }, socket) {
  socket.leave(chatId);
  socket.to(chatId).emit(SOCKET_EVENTS.CHAT.USER_LEFT, { chatId, username });
}
