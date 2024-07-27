import * as zlib from "node:zlib";
import { promisify } from "node:util";

import { HttpRequest, HttpResponse } from "./httpTypes";

const gzipPromise = promisify(zlib.gzip);

export const handleCompression = async (
  req: HttpRequest,
  res: HttpResponse
) => {
  const rawAcceptedEncodings = req.headers.get("Accept-Encoding");

  // @example ["gzip", "deflate", "br"]
  const acceptedEncodings = rawAcceptedEncodings
    ? rawAcceptedEncodings.split(",").map((encoding) => encoding.trim())
    : [];

  if (acceptedEncodings.includes("gzip")) {
    res.headers.set("Content-Encoding", "gzip");
    const body = Buffer.from(res.body ?? "");
    const compressed = await gzipPromise(body);
    res.headers.set("Content-Length", `${compressed.length}`);
    res.body = compressed;
  }
};
