import { describe, expect, test } from "bun:test";
import { Route } from "./route";
import { HttpMethod, HttpRequest, HttpResponse } from "./http-types";

const echoHandler = (req: HttpRequest, res: HttpResponse): HttpResponse => {
  res.body = `Echo: ${req.params?.message}`;
  return res;
};

describe("Route class functionality", () => {
  test("initializes with correct parameters and regex pattern", () => {
    const route = new Route("/echo/:message", HttpMethod.GET, echoHandler);

    expect(route.path).toBe("/echo/:message");
    expect(route.method).toBe(HttpMethod.GET);
    expect(route.pattern).toBeInstanceOf(RegExp);
    expect(route.paramNames).toEqual(["message"]);
  });

  test("matches method and path correctly", () => {
    const route = new Route("/echo/:message", HttpMethod.GET, echoHandler);
    const request: HttpRequest = {
      path: "/echo/hello",
      method: HttpMethod.GET,
    };

    expect(route.matches(request)).toBe(true);
  });

  test("does not match if HTTP method is different", () => {
    const route = new Route("/echo/:message", HttpMethod.GET, echoHandler);
    const request: HttpRequest = {
      path: "/echo/hello",
      method: HttpMethod.POST,
    };

    expect(route.matches(request)).toBe(false);
  });

  test("handles multiple path parameters correctly", async () => {
    const multiParamHandler = (
      req: HttpRequest,
      res: HttpResponse
    ): HttpResponse => {
      res.body = `User: ${req.params.userId}, Book: ${req.params.bookId}`;
      return res;
    };
    const route = new Route(
      "/users/:userId/books/:bookId",
      HttpMethod.GET,
      multiParamHandler
    );
    const request: HttpRequest = {
      path: "/users/123/books/456",
      method: HttpMethod.GET,
      params: {},
    };
    const response: HttpResponse = { body: "" };

    await route.handleRequest(request, response);

    expect(request.params?.userId).toBe("123");
    expect(request.params?.bookId).toBe("456");
    expect(response.body).toBe("User: 123, Book: 456");
  });

  test("parses and handles complex regex-like paths correctly", async () => {
    const complexPathHandler = (
      req: HttpRequest,
      res: HttpResponse
    ): HttpResponse => {
      res.body = `Param: ${req.params?.param}`;
      return res;
    };
    const route = new Route(
      "/complex-path-*:param/",
      HttpMethod.GET,
      complexPathHandler
    );
    const request: HttpRequest = {
      path: "/complex-path-abc123/",
      method: HttpMethod.GET,
      params: {},
    };
    const response: HttpResponse = { body: "" };

    const matches = route.matches(request);
    await route.handleRequest(request, response);

    expect(matches).toBe(true);
    expect(request.params?.param).toBe("abc123");
    expect(response.body).toBe("Param: abc123");
  });

  // Suggested additional tests could include scenarios with query parameters,
  // malformed URLs, very long paths, and high load simulations.
});
