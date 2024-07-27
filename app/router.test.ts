import { describe, expect, test, mock, beforeEach } from "bun:test";
import { Router } from "./router";
import { HttpRequest, HttpResponse, HttpMethod } from "./httpTypes";

// test helpers
function createMockRequest(method: HttpMethod, path: string): HttpRequest {
  return { method, path, version: "HTTP/1.1", headers: new Map(), body: "" };
}

function createMockResponse(): HttpResponse {
  return { statusCode: 0, statusMessage: "", headers: new Map() };
}

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  test("should route to the correct handler based on path and method", async () => {
    const mockHandler = mock((req: HttpRequest, res: HttpResponse) => {
      res.statusCode = 200;
      res.statusMessage = "OK";
      res.body = "Handled";
      return res;
    });
    router.addRoute(HttpMethod.GET, "/test", mockHandler);

    const request = createMockRequest(HttpMethod.GET, "/test");
    const response = await router.route(request);

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Handled");
  });

  test("should return a 404 response when no route matches", async () => {
    const request = createMockRequest(HttpMethod.GET, "/nonexistent");
    const response = await router.route(request);

    expect(response.statusCode).toBe(404);
    expect(response.statusMessage).toBe("Not Found");
  });

  test("should handle multiple path parameters correctly", async () => {
    const mockHandler = mock((req: HttpRequest, res: HttpResponse) => {
      res.statusCode = 200;
      res.statusMessage = "OK";
      res.body = `User: ${req.params?.userId}, Book: ${req.params?.bookId}`;
      return res;
    });
    router.addRoute(
      HttpMethod.GET,
      "/users/:userId/books/:bookId",
      mockHandler
    );

    const request = createMockRequest(HttpMethod.GET, "/users/123/books/456");
    const response = await router.route(request);

    expect(mockHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("User: 123, Book: 456");
  });

  test("should handle exceptions thrown by route handlers gracefully", async () => {
    const mockHandler = mock(async (req: HttpRequest, res: HttpResponse) => {
      throw new Error("Handler Error");
    });
    router.addRoute(HttpMethod.GET, "/error", mockHandler);

    const request = createMockRequest(HttpMethod.GET, "/error");
    const response = await router.route(request);

    expect(mockHandler).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
    expect(response.statusMessage).toBe("Internal Server Error");
  });
});
