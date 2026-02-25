import { Core } from "./core/core.ts";
import { logger } from "./core/middleware/logger.ts";
import { AuthApi } from "./api/auth/index.ts";
import { LmsApi } from "./api/lms/index.ts";
import { readFile } from "node:fs/promises";
import { rateLimit } from "./core/middleware/rate-limit.ts";

const core = new Core();

core.router.use([logger, rateLimit(10_000, 1000)]);

new AuthApi(core).init();
new LmsApi(core).init();

core.router.get("/", async (req, res) => {
  const index = await readFile("./front/index.html", "utf-8");
  res.setHeader("Content-Type", "text/html; charset=utf8");
  res.status(200).json(index);
});

core.init();
