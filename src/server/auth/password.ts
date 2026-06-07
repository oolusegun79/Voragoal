import { hash, verify } from "@node-rs/argon2";

// argon2id (default in @node-rs/argon2) with production-leaning parameters.
// Params self-describe in the hash string, so future tuning won't invalidate
// existing hashes.
const HASH_OPTS = {
  memoryCost: 19_456, // ~19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, HASH_OPTS);
}

export function verifyPassword(plain: string, stored: string): Promise<boolean> {
  return verify(stored, plain);
}
