import { CoreProvider } from "../../../core/utils/abstract.ts";
import { AuthQuery } from "../query.ts";
import { randomBytesAsync, sha256 } from "../utils.ts";

const ttlSec = 60 * 60 * 24 * 15;

export class SessionService extends CoreProvider {
  query = new AuthQuery(this.db);
  async create({ userId, ip, ua }: any) {
    const sid = (await randomBytesAsync(32)).toString("base64url");
    const sid_hash = sha256(sid);
    const expires_ms = Date.now() + ttlSec * 1000;

    this.query.insertSession({ sid_hash, expires_ms, userId, ip, ua });

    const cookie = `__Secure-sid=${sid}; Path=/; Max-Age=${ttlSec}; HttpOnly; Secure; SameSite=Lax`;

    return { cookie };
  }
}
