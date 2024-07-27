import * as zlib from "node:zlib";
import { HttpRequest, HttpResponse } from "./httpTypes";

export const handleCompression = async (
  req: HttpRequest,
  res: HttpResponse
) => {
  const rawAcceptedEncodings = req.headers.get("Accept-Encoding");
  const acceptedEncodings = rawAcceptedEncodings
    ? rawAcceptedEncodings.split(",").map((encoding) => encoding.trim())
    : [];

  if (acceptedEncodings.includes("gzip") && res.body) {
    const compressed = zlib.gzipSync(res.body);
    res.headers.set("Content-Encoding", "gzip");
    res.headers.set("Content-Length", `${compressed.length}`);
    res.body = compressed;
  }
};
