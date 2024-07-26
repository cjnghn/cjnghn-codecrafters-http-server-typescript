import * as net from "net";

// Types
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

type HttpRequestLine = {
  method: HttpMethod;
  path: string;
  version: string;
};

type HttpHeaders = Map<string, string>;

type HttpRequest = {
  requestLine: HttpRequestLine;
  headers?: HttpHeaders;
  body?: string;
};

type HttpResponse = {
  statusCode: number;
  statusMessage: string;
  headers?: HttpHeaders;
  body?: string;
};

// Request parsing functions
function parseHttpRequestLine(requestLineText: string): HttpRequestLine {
  const parts = requestLineText.split(" ");
  if (parts.length !== 3) {
    throw new Error("Invalid HTTP request line");
  }
  const [method, path, version] = parts;
  return { method: method as HttpMethod, path, version };
}

function parseHttpHeaders(headerLines: string[]): HttpHeaders {
  const headers = new Map<string, string>();
  for (const line of headerLines) {
    const [key, value] = line.split(": ");
    if (key && value) {
      headers.set(key.toLowerCase(), value);
    }
  }
  return headers;
}

function parseHttpRequest(rawRequest: string): HttpRequest {
  const lines = rawRequest.split("\r\n");
  const requestLine = parseHttpRequestLine(lines[0]);
  const blankLineIndex = lines.findIndex((line) => line === "");

  let headers: HttpHeaders | undefined;
  let body: string | undefined;

  // If there is a blank line
  if (blankLineIndex !== -1) {
    headers = parseHttpHeaders(lines.slice(1, blankLineIndex));
    body = lines.slice(blankLineIndex + 1).join("\r\n");
    if (body.length === 0) body = undefined;
  }
  // If there is no blank line
  else {
    headers = parseHttpHeaders(lines.slice(1));
  }

  if (headers.size === 0) headers = undefined;

  return { requestLine, headers, body };
}

// Response creation function
function createHttpResponse(response: HttpResponse): string {
  let responseText = `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`;

  if (response.headers) {
    for (const [key, value] of response.headers) {
      responseText += `${key}: ${value}\r\n`;
    }
  }

  responseText += "\r\n";

  if (response.body) {
    responseText += response.body;
  }

  return responseText;
}

// Request handling function
function handleHttpRequest(request: HttpRequest): HttpResponse {
  const { method, path } = request.requestLine;

  // GET /
  if (method === "GET" && path === "/") {
    return {
      statusCode: 200,
      statusMessage: "OK",
    };
  }
  // GET /echo/:content
  else if (method === "GET" && path.startsWith("/echo/")) {
    const content = path.slice(6);
    return {
      statusCode: 200,
      statusMessage: "OK",
      headers: new Map([
        ["Content-Type", "text/plain"],
        ["Content-Length", content.length.toString()],
      ]),
      body: content,
    };
  }
  // GET /user-agent
  else if (method === "GET" && path === "/user-agent") {
    const userAgent = request.headers?.get("user-agent");
    return {
      statusCode: 200,
      statusMessage: "OK",
      headers: new Map([["Content-Type", "text/plain"]]),
      body: userAgent,
    };
  } else {
    return {
      statusCode: 404,
      statusMessage: "Not Found",
    };
  }
}

// Create and start the server
const httpServer = net.createServer((socket) => {
  socket.on("data", (data) => {
    try {
      const rawRequest = data.toString();
      const parsedRequest = parseHttpRequest(rawRequest);
      const response = handleHttpRequest(parsedRequest);
      const responseText = createHttpResponse(response);
      socket.write(responseText);
    } catch (error) {
      console.error("Error handling HTTP request:", error);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
    } finally {
      socket.end();
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

const HTTP_PORT = 4221;
const HTTP_HOST = "localhost";

httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
  console.log(`HTTP server listening on ${HTTP_HOST}:${HTTP_PORT}`);
});
