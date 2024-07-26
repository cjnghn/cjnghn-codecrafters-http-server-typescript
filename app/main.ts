import * as net from "net";
import * as fs from "fs/promises";
import * as path from "path";

// Types
type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

interface HttpRequestLine {
  method: HttpMethod;
  path: string;
  version: string;
}

type HttpHeaders = Map<string, string>;

interface HttpRequest {
  requestLine: HttpRequestLine;
  headers?: HttpHeaders;
  body?: string;
}

interface HttpResponse {
  statusCode: number;
  statusMessage: string;
  headers?: HttpHeaders;
  body?: string | Buffer;
}

// Configuration
const HTTP_PORT = 4221;
const HTTP_HOST = "localhost";
let FILE_DIRECTORY = "./"; // Default directory

// Parse command line arguments
process.argv.forEach((arg, index) => {
  if (arg === "--directory" && process.argv[index + 1]) {
    FILE_DIRECTORY = process.argv[index + 1];
  }
});

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
  return new Map(
    headerLines
      .map((line) => line.split(": "))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key.toLowerCase(), value])
  );
}

function parseHttpRequest(rawRequest: string): HttpRequest {
  const lines = rawRequest.split("\r\n");
  const requestLine = parseHttpRequestLine(lines[0]);
  const blankLineIndex = lines.findIndex((line) => line === "");

  let headers: HttpHeaders | undefined;
  let body: string | undefined;

  if (blankLineIndex !== -1) {
    headers = parseHttpHeaders(lines.slice(1, blankLineIndex));
    body = lines.slice(blankLineIndex + 1).join("\r\n") || undefined;
  } else {
    headers = parseHttpHeaders(lines.slice(1));
  }

  return { requestLine, headers: headers.size > 0 ? headers : undefined, body };
}

// Response creation function
function createHttpResponse(response: HttpResponse): string | Buffer {
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
async function handleHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  const { method, path: reqPath } = request.requestLine;

  switch (true) {
    case method === "GET" && reqPath === "/":
      return { statusCode: 200, statusMessage: "OK" };

    case method === "GET" && reqPath.startsWith("/echo/"):
      const content = reqPath.slice(6);
      return {
        statusCode: 200,
        statusMessage: "OK",
        headers: new Map([
          ["Content-Type", "text/plain"],
          ["Content-Length", content.length.toString()],
        ]),
        body: content,
      };

    case method === "GET" && reqPath === "/user-agent":
      const userAgent = request.headers?.get("user-agent") || "";
      return {
        statusCode: 200,
        statusMessage: "OK",
        headers: new Map([
          ["Content-Type", "text/plain"],
          ["Content-Length", userAgent.length.toString()],
        ]),
        body: userAgent,
      };

    case method === "GET" && reqPath.startsWith("/files/"):
      const fileName = reqPath.slice(7);
      const filePath = path.join(FILE_DIRECTORY, fileName);

      try {
        await fs.access(filePath, fs.constants.R_OK);
        const file = await fs.readFile(filePath);
        return {
          statusCode: 200,
          statusMessage: "OK",
          headers: new Map([
            ["Content-Type", "application/octet-stream"],
            ["Content-Length", file.length.toString()],
          ]),
          body: file,
        };
      } catch (error) {
        return { statusCode: 404, statusMessage: "Not Found" };
      }

    default:
      return { statusCode: 404, statusMessage: "Not Found" };
  }
}

// Create and start the server
const httpServer = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const rawRequest = data.toString();
      const parsedRequest = parseHttpRequest(rawRequest);
      const response = await handleHttpRequest(parsedRequest);
      const responseData = createHttpResponse(response);
      socket.write(responseData);
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

httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
  console.log(`HTTP server listening on ${HTTP_HOST}:${HTTP_PORT}`);
  console.log(`Serving files from directory: ${FILE_DIRECTORY}`);
});
