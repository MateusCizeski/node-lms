import { Query } from "../../core/utils/abstract";

type UserRole = "admin" | "editor" | "user";

type UserData = {
  id: number;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  password_hash: string;
  created: string;
  updated: string;
};

type UserCreate = Omit<UserData, "id" | "create" | "updated">;

export class AuthQuery extends Query {
  insertUser({ name, username, email, role, password_hash }: UserData) {
    return this.db
      .query(
        /*sql*/ `
      INSERT OR IGNORE INTO "users"
      ("name", "username", "email", "role", "password_hash" )
      VALUES (?,?,?,?,?)`,
      )
      .run(name, username, email, role, password_hash);
  }
}
