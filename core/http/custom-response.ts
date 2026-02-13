import type { ServerResponse } from "node:http";

export interface CustomResponse extends ServerResponse {
  status(code: number): CustomResponse;
  json(data: any): void;
  setCookie(cookie: string): void;
}

export function customResponse(response: ServerResponse) {
  const res = response as CustomResponse;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (value) => {
    try {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    } catch {
      res.status(500).end("error");
    }
  };

  res.setCookie = (cookie) => {
    const current = res.getHeader("Set-Cookie");

    if (current == undefined) {
      res.setHeader("Set-Cokkie", [cookie]);
      return;
    }

    if (Array.isArray(current)) {
      current.push(cookie);
      res.setHeader("Set-Cokkie", current);
      return;
    }

    res.setHeader("Set-cookie", [String(current), cookie]);
  };
  return res;
}
