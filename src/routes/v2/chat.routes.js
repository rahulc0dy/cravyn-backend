import logger from "../../utils/shared/logger.js";

const chatRoutes = () => {};

const socketConnectionRouter = (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on("disconnect", (socket) => {
    console.log(socket);
  });
};

export { socketConnectionRouter };
