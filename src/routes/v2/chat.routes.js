import { getSocketServerIo } from "../../utils/v2/socketServer.js";

const io = getSocketServerIo();

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("message", (msg) => {
    console.log("new msgsldfjsldfj");
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
