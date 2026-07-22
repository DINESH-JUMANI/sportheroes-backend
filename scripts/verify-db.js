const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const t = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  const u = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('auth_uid', 'password_hash', 'supabase_uid') ORDER BY column_name"
  );
  const s = await c.query('SELECT COUNT(*)::int AS sports FROM sports');
  const users = await c.query('SELECT COUNT(*)::int AS users FROM users');
  console.log('Tables:', t.rows.length);
  console.log('Table names:', t.rows.map((r) => r.tablename).join(', '));
  console.log('users columns:', u.rows.map((r) => r.column_name));
  console.log('sports:', s.rows[0].sports, 'users:', users.rows[0].users);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
