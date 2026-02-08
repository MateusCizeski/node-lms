import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../query.ts";

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);

  async create({ userId, ip, ua }) {
    const sid_hash = 1;
    const expires_ms = Date.now() + 60 * 60 * 24 * 15 * 1000;

    this.query.insertSession({ sid_hash, userId, expires_ms, ip, ua });

    return sid_hash;
  }
}
