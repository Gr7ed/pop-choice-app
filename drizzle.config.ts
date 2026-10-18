import { readFileSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const readDevVar = (key: string): string | undefined => {
  // 1. Check system environment variables first
  if (process.env[key]) return process.env[key];

  try {
    const contents = readFileSync('.dev.vars', 'utf8');
    
    // 2. Parse lines manually to safely strip quotes, whitespace, and comments
    for (const line of contents.split('\n')) {
      const trimmedLine = line.trim();
      
      // Skip comments or empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const [varKey, ...valueParts] = trimmedLine.split('=');
      if (varKey?.trim() === key) {
        const value = valueParts.join('=').trim();
        // Remove leading and trailing double or single quotes if present
        return value.replace(/^["'](.*)["']$/, '$1');
      }
    }
  } catch {
    // .dev.vars doesn't exist or isn't readable
    return undefined;
  }

  return undefined;
};

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: readDevVar('SUPABASE_DB_URL') ?? 'postgres://localhost:5432/postgres',
  },
});