import { Api } from "../../core/utils/abstract.ts";
import { RouteError } from "../../core/utils/route-error.ts";
import { AuthQuery } from "./query.ts";
import { COOKIE_SID_KEY, SessionService } from "./services/session.ts";
import { authTables } from "./tables.ts";
import { AuthMiddleware } from "./middleware/auth.ts";
import { Password } from "./utils/password.ts";
import { validate } from "../../core/utils/validate.ts";

export class AuthApi extends Api {
  query = new AuthQuery(this.db);
  session = new SessionService(this.core);
  auth = new AuthMiddleware(this.core);
  pass = new Password("segredo");

  handlers = {
    postUser: async (req, res) => {
      const { name, username, email, password } = {
        name: validate.string(req.body.name),
        username: validate.string(req.body.username),
        email: validate.email(req.body.email),
        password: validate.password(req.body.password),
      };

      const emailExists = this.query.selectUser("email", email);

      if (!emailExists) {
        throw new RouteError(409, "Email existente.");
      }

      const usernameExists = this.query.selectUser("username", username);
      if (!usernameExists) {
        throw new RouteError(409, "Username existente.");
      }

      const password_hash = await this.pass.hash(password);

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
      const { email, password } = {
        email: validate.email(req.body.email),
        password: validate.password(req.body.password),
      };

      const user = this.query.selectUser("email", email);

      if (!user) {
        throw new RouteError(400, "Email ou senha incorretos.");
      }

      const validPassword = await this.pass.verify(
        password,
        user.password_hash,
      );

      if (!validPassword) {
        throw new RouteError(400, "Email ou senha incorretos.");
      }

      const { cookie } = await this.session.create({
        user_id: user.id,
        ip: req.ip,
        ua: req.headers["user-agent"] ?? "",
      });

      res.setCookie(cookie);
      res.status(200).json({ title: "Autenticado" });
    },

    getSession: (req, res) => {
      if (!req.session) {
        throw new RouteError(401, "Não autorizado.");
      }

      res.status(200).json({ title: "Autorizado." });
    },

    deleteSession: (req, res) => {
      const sid = req.cookies[COOKIE_SID_KEY];
      const { cookie } = this.session.invalidate(sid);

      res.setCookie(cookie);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("Vary", "Cookie");

      res.status(204).json({ title: "Logout" });
    },

    updatePassword: async (req, res) => {
      const { password, new_password } = {
        password: validate.password(req.body.password),
        new_password: validate.password(req.body.new_password),
      };

      if (!req.session) {
        throw new RouteError(401, "Não autorizado.");
      }

      const user = this.query.selectUser("id", req.session.user_id);

      if (!user) {
        throw new RouteError(404, "Usuário não encontrado.");
      }

      const validPassword = await this.pass.verify(
        password,
        user.password_hash,
      );

      if (!validPassword) {
        throw new RouteError(400, "Senha atual incorreta.");
      }

      const new_password_hash = await this.pass.hash(new_password);
      const updateResult = this.query.updateUser(
        user.id,
        "password_hash",
        new_password_hash,
      );

      if (updateResult.changes === 0) {
        throw new RouteError(400, "Erro ao atualizar senha.");
      }

      this.session.invalidateAll(user.id);

      const { cookie } = await this.session.create({
        user_id: user.id,
        ip: req.ip,
        ua: req.headers["user-agent"] || "",
      });

      res.setCookie(cookie);
      res.status(200).json({ title: "Senha atualizada." });
    },

    passwordForgot: async (req, res) => {
      const { email } = {
        email: validate.email(req.body.email),
      };

      const user = this.query.selectUser("email", email);

      if (!user) {
        return res.status(200).json({ title: "Verifique seu e-mail." });
      }

      const { token } = await this.session.resetToken({
        user_id: user.id,
        ip: req.ip,
        ua: req.headers["user-agent"] || "",
      });

      const resetLink = `${req.baseurl}/password/?token=${token}`;

      const mailContent = {
        to: user.email,
        subject: "Password Reset",
        body: `Utilize o link abaixo para resetar a sua senha: \r\n ${resetLink}`,
      };

      console.log(mailContent);
      res.status(200).json({ title: "Verifique seu email" });
    },

    passwordReset: async (req, res) => {
      const { token, new_password } = {
        token: validate.string(req.body.token),
        new_password: validate.password(req.body.new_password),
      };

      const reset = this.session.validateToken(token);

      if (!reset) {
        throw new RouteError(400, "Token inválido");
      }

      const new_password_hash = await this.pass.hash(new_password);
      const updateResult = this.query.updateUser(
        reset.user_id,
        "password_hash",
        new_password_hash,
      );

      if (updateResult.changes === 0) {
        throw new RouteError(400, "erro ao atualizar senha");
      }

      res.status(200).json({ title: "Senha atualizada." });
    },
  } satisfies Api["handlers"];

  tables(): void {
    this.db.exec(authTables);
  }

  routes(): void {
    this.router.post("/auth/user", this.handlers.postUser);
    this.router.post("/auth/login", this.handlers.postLogin);
    this.router.post("/auth/session", this.handlers.getSession, [
      this.auth.guard("user"),
    ]);
    this.router.delete("/auth/logout", this.handlers.deleteSession);
    this.router.put("/auth/password/update", this.handlers.updatePassword, [
      this.auth.guard("user"),
    ]);
    this.router.post("/auth/password/forgot", this.handlers.passwordForgot);
    this.router.post("/auth/password/reset", this.handlers.passwordReset);
  }
}
