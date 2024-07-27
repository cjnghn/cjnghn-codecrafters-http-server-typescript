import { Route } from "./route";
import { HttpRequest, HttpResponse, HttpMethod } from "./http-types";

/**
 * Manages routing of HTTP requests to the correct handlers based on method and path.
 */
export class Router {
  private routes: Route[] = [];

  /**
   * Adds a route to the router.
   * @param {HttpMethod} method The HTTP method for the route.
   * @param {string} path The path for the route.
   * @param {Function} handler The function to handle the route.
   * @example
   * router.addRoute('GET', '/users/:userId', async (req, res) => {
   *     const user = await getUserById(req.params.userId);
   *     res.body = JSON.stringify(user);
   *     return res;
   * });
   */
  addRoute(
    method: HttpMethod,
    path: string,
    handler: (
      req: HttpRequest,
      res: HttpResponse
    ) => HttpResponse | Promise<HttpResponse>
  ): void {
    const route = new Route(path, method, handler);
    this.routes.push(route);
  }

  /**
   * Routes an HTTP request to the appropriate handler based on its method and path.
   * @param {HttpRequest} request The request to route.
   * @return {Promise<HttpResponse>} The response from the handler.
   */
  async route(request: HttpRequest): Promise<HttpResponse> {
    const response: HttpResponse = {
      statusCode: 404,
      statusMessage: "Not Found",
      headers: new Map(),
    };

    for (const route of this.routes) {
      if (route.matches(request)) {
        try {
          return await route.handleRequest(request, response);
        } catch (error) {
          return {
            statusCode: 500,
            statusMessage: "Internal Server Error",
            headers: new Map(),
          };
        }
      }
    }

    return response;
  }
}
