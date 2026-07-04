/**
 * Runs a flat SQL migration file against DATABASE_URL.
 *
 * Usage:
 *   node scripts/run-migration.js 1.add_user.sql
 *   npm run db:migrate -- 1.add_user.sql
 *   npm run db:migrate:1
 *
 * Equivalent psql command:
 *   psql "<DATABASE_URL>" -f prisma/migrations/1.add_user.sql
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const fileName = process.argv[2];

  if (!fileName) {
    console.error('Usage: node scripts/run-migration.js <migration-file>');
    console.error('Example: node scripts/run-migration.js 1.add_user.sql');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const migrationPath = path.resolve(__dirname, '..', 'prisma', 'migrations', fileName);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });

  console.log(`Running migration: ${fileName}`);

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Migration completed: ${fileName}`);
  } catch (error) {
    console.error(`Migration failed: ${fileName}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
