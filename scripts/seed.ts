/**
 * Load demo/seed data (supabase/seed.sql) into the configured database.
 */

import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Add it to .env.local.');
    process.exit(1);
  }
  const path = join(process.cwd(), 'supabase', 'seed.sql');
  try {
    execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-f', path], {
      stdio: 'inherit',
    });
    console.log('Seed data loaded.');
  } catch {
    console.error(
      "Failed to seed. Ensure 'psql' is installed or run supabase/seed.sql manually.",
    );
    process.exit(1);
  }
}

main();
