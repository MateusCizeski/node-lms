import type { IncomingMessage } from "node:http";

type HttpMethod = "GET" | "POST";

export interface CustomRequest extends IncomingMessage {
  method: HttpMethod;
  query: URLSearchParams;
  pathname: string;
  body: Record<string, any>;
  params: Record<string, any>;
  ip: string;
}

export async function customRequest(request: IncomingMessage) {
  const req = request as CustomRequest;
  const url = new URL(req.url || "", "http://localhost");
  req.query = url.searchParams;
  req.pathname = url.pathname;
  req.params = {};
  req.body = {};
  req.ip = req.socket.remoteAddress || "127.0.0.1";

  return req;
}
