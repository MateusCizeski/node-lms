import { randomBytes } from "node:crypto";
import { promisify } from "node:util";

export const randomBytesAsync = promisify(randomBytes);
