import { HttpRequest, HttpResponse, HttpMethod } from "./httpTypes";

/**
 * Represents a single route in the router with a method, path, and handler function.
 */
export class Route {
  public readonly pattern: RegExp;
  public readonly paramNames: string[];

  /**
   * Creates a route with a given path, HTTP method, and handler.
   * @param {string} path The URL path of the route with parameters.
   * @param {HttpMethod} method The HTTP method (GET, POST, etc.).
   * @param {Function} handler The function to handle requests to this route.
   */
  constructor(
    public readonly path: string,
    public readonly method: HttpMethod,
    public readonly handler: (
      req: HttpRequest,
      res: HttpResponse
    ) => HttpResponse | Promise<HttpResponse>
  ) {
    this.paramNames = [];
    // Convert path parameters into regex groups to match the actual request paths.
    const regexPath = path.replace(/:([^\/]+)/g, (_, key) => {
      this.paramNames.push(key);
      return "([^/]+)";
    });
    this.pattern = new RegExp(`^${regexPath}$`); // /echo/:message1/:message2 => /echo/([^/]+)/([^/]+)
  }

  /**
   * Checks if the request matches this route based on method and path.
   * @param {HttpRequest} request The HTTP request to check.
   * @return {boolean} True if the request matches this route.
   */
  matches(request: HttpRequest): boolean {
    return this.method === request.method && this.pattern.test(request.path);
  }

  /**
   * Handles the request if it matches this route, setting parameters and invoking the handler.
   * @param {HttpRequest} request The incoming HTTP request.
   * @param {HttpResponse} response The response object to populate.
   * @return {HttpResponse | Promise<HttpResponse>} The populated response object.
   * @example
   * const route = new Route('/echo/:message', 'GET', (req, res) => {
   *     res.body = `Echo: ${req.params.message}`;
   *     return res;
   * });
   * route.handleRequest(parsedRequest, response);
   */
  handleRequest(
    request: HttpRequest,
    response: HttpResponse
  ): HttpResponse | Promise<HttpResponse> {
    const match = this.pattern.exec(request.path);
    if (match) {
      request.params = match.slice(1).reduce((params, value, index) => {
        params[this.paramNames[index]] = value;
        return params;
      }, {} as { [key: string]: string });
      return this.handler(request, response);
    }
    return response;
  }
}
