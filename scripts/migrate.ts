/**
 * Apply SQL migrations to the configured PostgreSQL database in filename order.
 *
 * Uses DATABASE_URL. For Supabase you can alternatively paste the files into
 * the SQL editor, or use the Supabase CLI (`supabase db push`). This script is
 * a dependency-free option using `psql` if available, else prints instructions.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to .env.local.');
    process.exit(1);
  }
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Applying ${files.length} migration(s)...`);
  for (const file of files) {
    const path = join(MIGRATIONS_DIR, file);
    console.log(`  -> ${file}`);
    try {
      execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', path], {
        stdio: 'inherit',
      });
    } catch (err) {
      console.error(
        `\nFailed on ${file}. Ensure 'psql' is installed, or run the SQL files ` +
          `manually in the Supabase SQL editor (supabase/migrations/*.sql).`,
      );
      process.exit(1);
    }
  }
  console.log('Migrations applied.');
}

main();
