import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthQuery } from "./query.ts";
import { COOKIE_SID_KEY, SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  session = new SessionService(this.core);

  handlers = {
    postUser: (req, res) => {
      const { name, username, email, role, password } = req.body;
      const password_hash = password;
      const writeResult = this.query.insertUser({
        name,
        username,
        email,
        role: "user",
        password_hash,
      });

      if (writeResult.changes === 0) {
        throw new RouteError(400, "Erro ao criar o usuário.");
      }

      res.status(201).json({ title: "usuário criado" });
    },

    postLogin: async (req, res) => {
      const { email, password } = req.body;
      const user = this.db
        .query(
          /*sql*/ `
        SELECT "id", "password_hash" FROM "users" WHERE "email" = ?
        `,
        )
        .get(email);

      if (!user || password !== user.password_hash) {
        throw new RouteError(400, "Email ou senha incorretos.");
      }

      const { cookie } = await this.session.create({
        userId: user.id,
        ip: req.ip,
        ua: req.headers["user-agent"] ?? "",
      });

      res.setCookie(cookie);
      res.status(200).json({ title: "Autenticado" });
    },

    getSession: (req, res) => {
      const sid = req.cookies[COOKIE_SID_KEY];

      if (!sid) {
        throw new RouteError(401, "Não autorizado.");
      }

      const { valid, cookie, session } = this.session.validate(sid);
      res.setCookie(cookie);

      if (!valid || !session) {
        throw new RouteError(401, "Não autorizado.");
      }

      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Vary", "Cookie");
      res.status(200).json(session);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
    this.router.post("/auth/login", this.handlers.postLogin);
    this.router.post("/auth/session", this.handlers.getSession);
  }
}
