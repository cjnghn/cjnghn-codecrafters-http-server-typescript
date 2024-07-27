import * as net from "node:net";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { parseHttpRequest, formatHttpResponse } from "./httpUtils";
import { Router } from "./router";
import { HttpMethod } from "./httpTypes";
import { handleCompression } from "./compression";

export let FILE_DIRECTORY = "./";

process.argv.forEach((arg, index) => {
  if (arg === "--directory" && process.argv[index + 1]) {
    FILE_DIRECTORY = process.argv[index + 1];
  }
});

const router = new Router();

router.addRoute(HttpMethod.GET, "/", async (req, res) => {
  res.statusCode = 200;
  res.statusMessage = "OK";
  res.headers.set("Content-Type", "text/plain");
  return res;
});

router.addRoute(HttpMethod.GET, "/user-agent", async (req, res) => {
  const userAgent = req.headers.get("User-Agent");
  res.statusCode = 200;
  res.statusMessage = "OK";
  res.headers.set("Content-Type", "text/plain");
  res.headers.set("Content-Length", userAgent?.length.toString() ?? "0");
  res.body = userAgent;
  return res;
});

router.addRoute(HttpMethod.GET, "/echo/:message", async (req, res) => {
  res.statusCode = 200;
  res.statusMessage = "OK";
  res.headers.set("Content-Type", "text/plain");
  res.headers.set("Content-Length", `${req.params?.message.length}`);
  res.body = `${req.params?.message}`;

  await handleCompression(req, res);

  return res;
});

router.addRoute(HttpMethod.GET, "/files/:filename", async (req, res) => {
  const filename = req.params?.filename;
  if (!filename) {
    res.statusCode = 400;
    res.statusMessage = "Bad Request";
    return res;
  }

  const filePath = path.join(FILE_DIRECTORY, filename);
  try {
    const file = await fs.readFile(filePath);
    res.statusCode = 200;
    res.statusMessage = "OK";
    res.headers.set("Content-Type", "application/octet-stream");
    res.headers.set("Content-Length", file.length.toString());
    res.body = file;
    return res;
  } catch (e) {
    return { statusCode: 404, statusMessage: "Not Found", headers: new Map() };
  }
});

router.addRoute(HttpMethod.POST, "/files/:filename", async (req, res) => {
  const filename = req.params?.filename;
  if (!filename) {
    res.statusCode = 400;
    res.statusMessage = "Bad Request";
    return res;
  }

  const filePath = path.join(FILE_DIRECTORY, filename);
  try {
    await fs.writeFile(filePath, req.body ?? "");
    res.statusCode = 201;
    res.statusMessage = "Created";
    return res;
  } catch (e) {
    return {
      statusCode: 500,
      statusMessage: "Internal Server Error",
      headers: new Map(),
    };
  }
});

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    try {
      const rawRequest = data.toString();
      const req = parseHttpRequest(rawRequest);
      const res = await router.route(req);
      const rawResponse = formatHttpResponse(res);
      socket.write(rawResponse);
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

export default server;
