import { Core } from "./core/core.ts";
import { logger } from "./core/middleware/logger.ts";
import { AuthApi } from "./api/auth/index.ts";
import { LmsApi } from "./api/lms/index.ts";
import { readFile } from "node:fs/promises";
import { RouteError } from "./core/utils/route-error.ts";
import { sha256 } from "./api/auth/utils.ts";

const core = new Core();

core.router.use([logger]);

new AuthApi(core).init();
new LmsApi(core).init();

core.router.get("/", async (req, res) => {
  const index = await readFile("./front/index.html", "utf-8");
  res.setHeader("Content-Type", "text/html; charset=utf8");
  res.status(200).json(index);
});

core.router.get("/segura", async (req, res) => {
  const sid = req.headers.cookie?.replace("sid=", "");
  console.log(sid);
  if (!sid) {
    throw new RouteError(401, "não autenticado");
  }
  const sid_hash = sha256(sid);
  const session = core.db
    .query(`SELECT "user_id" FROM "sessions" WHERE "sid_hash" = ?`)
    .get(sid_hash);

  if (!session) {
    throw new RouteError(404, "usuário não encontrado");
  }
  res.status(200).json(session);
});

core.init();
