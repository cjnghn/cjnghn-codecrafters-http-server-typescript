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

/**
 * Formats an HttpResponse object into a raw HTTP response string.
 *
 * @param {HttpResponse} response - The HTTP response object to format.
 * @returns {string} A raw HTTP response string.
 * @example
 * ```ts
 * const response = {
 *   statusCode: 200,
 *   statusMessage: 'OK',
 *   headers: new Map([['Content-Type', 'text/html'], ['Content-Length', '1024']]),
 *   body: 'Hello, world!'
 * };
 * const httpResponse = formatHttpResponse(response);
 * console.log(httpResponse);
 * // Outputs:
 * // HTTP/1.1 200 OK
 * // Content-Type: text/html
 * // Content-Length: 1024
 * //
 * // Hello, world!
 * ```
 */
export function formatHttpResponse(response: HttpResponse): string {
  let responseText = `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`;
  response.headers.forEach(
    (value, key) => (responseText += `${key}: ${value}\r\n`)
  );
  responseText += CRLF;
  if (response.body) {
    responseText +=
      response.body instanceof Buffer
        ? response.body.toString()
        : response.body;
  }
  return responseText;
}
