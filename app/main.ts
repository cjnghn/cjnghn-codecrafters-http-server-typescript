import server from "./server";

const HTTP_PORT = 4221;
const HTTP_HOST = "localhost";

server.listen(HTTP_PORT, HTTP_HOST, () => {
  console.log(`HTTP server listening on ${HTTP_HOST}:${HTTP_PORT}`);
});
