export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
  CONNECT = "CONNECT",
  TRACE = "TRACE",
}

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  version: string;
  headers: Map<string, string>;
  body?: string;
  params?: { [key: string]: string };
}

export interface HttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: Map<string, string>;
  body?: string | Buffer;
}
