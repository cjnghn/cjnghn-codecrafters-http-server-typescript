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

  console.log("acceptedEncodings", acceptedEncodings);
  console.log("res.body", res.body);

  if (acceptedEncodings.includes("gzip") && res.body) {
    const compressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(res.body ?? "", (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    res.headers.set("Content-Encoding", "gzip");
    res.headers.set("Content-Length", `${compressed.length}`);
    res.body = compressed;
  }
};
