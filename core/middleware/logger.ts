import type { Middleware } from "../router";

export const logger: Middleware = (req, res) => {
  console.log(`${req.method} ${req.pathname}`);
};
