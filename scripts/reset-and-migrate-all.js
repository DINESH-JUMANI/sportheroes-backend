/**
 * Wipe public schema and re-run all SQL migrations in order.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/reset-and-migrate-all.js
 *
 * WARNING: Destructive — drops all tables, types, and data in public schema.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS = [
  '1.add_user.sql',
  '2.add_sports_and_player_profiles.sql',
  '3.add_teams.sql',
  '4.add_tournaments.sql',
  '5.add_matches.sql',
  '6.add_statistics.sql',
  '7.seed_dev_user.sql',
  '8.seed_dev_user_2.sql',
  '9.seed_sports.sql',
  '10.team_roles_and_logo_blob.sql',
  '11.sport_specific_rules.sql',
  '12.team_logo_blob.sql',
  '13.teams_all_sports.sql',
  '14.add_venues.sql',
  '15.help_and_support.sql',
  '16.supabase_auth_storage_started_by.sql',
  '17.password_auth.sql',
];

const RESET_SQL = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
`;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const safeHost = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`\n=== Reset + migrate ===\nTarget: ${safeHost}\n`);

  const client = new Client({ connectionString: databaseUrl });
  const migrationsDir = path.resolve(__dirname, '..', 'prisma', 'migrations');

  try {
    await client.connect();

    console.log('Dropping public schema (all tables & data)...');
    await client.query(RESET_SQL);
    console.log('Schema reset complete.\n');

    for (const file of MIGRATIONS) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing migration: ${file}`);
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running: ${file}`);
      await client.query(sql);
      console.log(`  ✓ ${file}\n`);
    }

    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log(`Done. ${tables.rows.length} tables in public schema.`);
  } catch (error) {
    console.error('\nFailed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
