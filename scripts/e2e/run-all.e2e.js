#!/usr/bin/env node
/**
 * Run all module E2E scripts in dependency order.
 * Seeds local DB with demo data for Flutter FE development.
 *
 * Usage: npm run e2e:all
 * Prerequisite: npm run dev (server must be running)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPTS = [
  '01-auth.e2e.js',
  '02-sports.e2e.js',
  '02b-players.e2e.js',
  '03-teams.e2e.js',
  '04-tournaments.e2e.js',
  '05-matches.e2e.js',
  '05b-tt-rules.e2e.js',
  '05c-badminton-rules.e2e.js',
  '06-statistics.e2e.js',
];

const STATE_FILE = path.join(__dirname, '.e2e-state.json');

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     SportHeroes — Full E2E Test & Seed Suite     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\nUsing local DATABASE_URL via running API server.');
  console.log('Ensure: npm run dev is running in another terminal.\n');

  // Fresh state for full run
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);

  const start = Date.now();
  let failed = false;

  for (const script of SCRIPTS) {
    const scriptPath = path.join(__dirname, script);
    try {
      execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
    } catch {
      failed = true;
      console.error(`\n❌ Failed at ${script}\n`);
      break;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    console.log('\n📦 Seeded record IDs (saved to scripts/e2e/.e2e-state.json):');
    console.log(JSON.stringify(state, null, 2));
  }

  if (failed) {
    console.log(`\n❌ E2E suite failed after ${elapsed}s\n`);
    process.exit(1);
  }

  console.log(`\n✅ All E2E modules passed in ${elapsed}s`);
  console.log('   Demo data is in your local DB — ready for Flutter FE.\n');
}

main();
