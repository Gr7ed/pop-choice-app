import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const SECRET_BYTES = 32;

export function generateBetterAuthSecret() {
  return `ba_${randomBytes(SECRET_BYTES).toString('base64url')}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${generateBetterAuthSecret()}\n`);
}
