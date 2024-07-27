import * as net from "net";
import * as fs from "fs/promises";
import * as path from "path";
import * as zlib from "zlib";
import { promisify } from "util";

import { parseHttpRequest, formatHttpResponse } from "./httpUtils";
import { Router } from "./router";
import { HttpMethod } from "./httpTypes";

const gzipPromise = promisify(zlib.gzip);

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
  res.statusCode = 200;
  res.statusMessage = "OK";
  res.headers.set("Content-Type", "text/plain");
  res.body = req.headers.get("User-Agent") ?? "";
  return res;
});

router.addRoute(HttpMethod.GET, "/echo/:message", async (req, res) => {
  res.statusCode = 200;
  res.statusMessage = "OK";
  res.headers.set("Content-Type", "text/plain");

  const acceptedEncodings = req.headers.get("Accept-Encoding");
  if (acceptedEncodings?.includes("gzip")) {
    res.headers.set("Content-Encoding", "gzip");
    try {
      const body = Buffer.from(req.params?.message ?? "");
      const compressed = await gzipPromise(body);
      res.headers.set("Content-Length", `${compressed.length}`);
      res.body = compressed;
    } catch (error) {
      console.error("Error during compression:", error);
      res.statusCode = 500;
      res.statusMessage = "Internal Server Error";
      res.headers.set("Content-Length", "0");
      res.body = Buffer.from("Internal Server Error");
    }
  } else {
    res.headers.set("Content-Type", "text/plain");
    res.headers.set("Content-Length", `${req.params?.message.length}`);
    res.body = `${req.params?.message}`;
  }

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
      const request = parseHttpRequest(rawRequest);
      const response = await router.route(request);
      const responseData = formatHttpResponse(response);
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

export default server;
