import * as net from "net";

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    // console.log("Received:", data.toString());
    socket.write("HTTP/1.1 200 OK\r\n\r\n");
    socket.end();
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on localhost:4221");
});
