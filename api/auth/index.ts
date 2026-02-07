import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthQuery } from "./query.ts";
import { authTables } from "./tables.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);

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

    postLogin: (req, res) => {
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

      res.setHeader("Set-Cookie", `sid=${user.id}; Path=/`);

      res.status(200);
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
    this.router.post("/auth/login", this.handlers.postLogin);
  }
}
