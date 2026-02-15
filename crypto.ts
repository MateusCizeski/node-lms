import {
  type BinaryLike,
  type ScryptOptions,
  randomBytes,
  scrypt,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";

const randomBytesAsync = promisify(randomBytes);

const scryptAsync: (
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer> = promisify(scrypt);

const PEPPER = "segredo";

const salt = await randomBytesAsync(16);

const SCRYPT_OPTIONS: ScryptOptions = {
  N: 2 ** 14,
  r: 8,
  p: 1,
};

const password = "P@ssw0rd";
const passowrd_normalied = password.normalize("NFC");
const password_hmac = createHmac("sha256", PEPPER)
  .update(passowrd_normalied)
  .digest();

const dk = await scryptAsync(password_hmac, salt, 32, SCRYPT_OPTIONS);

const password_hash = `${salt.toString("hex")}$${dk.toString("hex")}`;
