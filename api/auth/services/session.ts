import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../query.ts";
import { randomBytesAsync } from "../utils.ts";

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);
  async create({ userId, ip, ua }) {
    const sid_hash = (await randomBytesAsync(32)).toString("base64url");

    const expires_ms = Date.now() + 60 * 60 * 24 * 15 * 1000;

    this.query.insertSession({ sid_hash, expires_ms, userId, ip, ua });

    return { sid_hash };
  }
}
