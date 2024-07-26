import * as net from "net";

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
