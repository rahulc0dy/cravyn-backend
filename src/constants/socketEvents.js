export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  CHAT: {
    SEND_MESSAGE: "sendMessage",
    RECEIVE_MESSAGE: "receiveMessage",
    TYPING: "typing",
    JOIN: "joinChat",
    LEAVE: "leaveChat",
    USER_JOINED: "userJoined",
    USER_LEFT: "userLeft",
    FETCH_HISTORY: "fetchChatHistory",
    HISTORY: "chatHistory",
    ERROR: "chatError",
  },
};
