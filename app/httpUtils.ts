import { HttpMethod, HttpRequest, HttpResponse } from "./httpTypes";

const CRLF = "\r\n";

/**
 * Parses a raw HTTP request string into a structured HttpRequest object.
 *
 * @param {string} rawRequest - The complete HTTP request as a raw string.
 * @returns {HttpRequest} A structured HTTP request object.
 * @example
 * ```ts
 * const requestString = "GET /index.html HTTP/1.1\r\nHost: www.example.com\r\n\r\n";
 * const httpRequest = parseHttpRequest(requestString);
 * console.log(httpRequest.method); // Outputs: GET
 * console.log(httpRequest.path); // Outputs: /index.html
 * console.log(httpRequest.headers.get('host')); // Outputs: www.example.com
 * ```
 */
export function parseHttpRequest(rawRequest: string): HttpRequest {
  const lines = rawRequest.split(CRLF);
  const [method, path, version] = lines[0].split(" ");

  const headers = new Map<string, string>();
  lines
    .slice(
      1,
      lines.findIndex((line) => line === "")
    )
    .forEach((line) => {
      const [key, value] = line.split(": ");
      headers.set(key.trim(), value.trim());
    });

  const bodyIndex = lines.findIndex((line) => line === "") + 1;
  const body = lines.slice(bodyIndex).join(CRLF).trim();

  return {
    method: method as HttpMethod,
    path,
    version,
    headers,
    body: body ? body : undefined,
  };
}

export function formatHttpResponse(response: HttpResponse): Buffer {
  let headerText = `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`;
  response.headers.forEach(
    (value, key) => (headerText += `${key}: ${value}\r\n`)
  );
  headerText += "\r\n";

  const headerBuffer = Buffer.from(headerText, "utf-8");
  const bodyBuffer =
    response.body instanceof Buffer
      ? response.body
      : Buffer.from(response.body || "");

  return Buffer.concat([headerBuffer, bodyBuffer]);
}
