import * as net from "net";

type RequestLine = {
  httpMethod: string;
  requestTarget: string;
  httpVersion: string;
};

type HttpRequest = {
  requestLine: RequestLine;
  headers: Map<string, string>;
  body: string;
};

function parseRequestLine(requestLine: string): RequestLine {
  const [httpMethod, requestTarget, httpVersion] = requestLine.split(" ");
  return { httpMethod, requestTarget, httpVersion };
}

function parseHeaders(headerLines: string[]): Map<string, string> {
  const headers = new Map<string, string>();
  headerLines.forEach((line) => {
    const [key, value] = line.split(": ");
    headers.set(key, value);
  });
  return headers;
}

function parseRequest(request: string): HttpRequest {
  const lines = request.split("\r\n");
  const requestLine = parseRequestLine(lines[0]);
  const separatorIndex = lines.findIndex((line) => line === "");
  const headers = parseHeaders(lines.slice(1, separatorIndex));
  const body = lines.slice(separatorIndex + 1).join("\r\n");

  return { requestLine, headers, body };
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const parsedRequest = parseRequest(request);

    if (
      parsedRequest.requestLine.httpMethod === "GET" &&
      parsedRequest.requestLine.requestTarget === "/"
    ) {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end();
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on localhost:4221");
});
