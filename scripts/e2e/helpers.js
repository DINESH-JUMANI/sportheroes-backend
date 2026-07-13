/**
 * Shared helpers for SportHeroes E2E API scripts.
 * Uses DATABASE_URL via the running API server (local only).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const STATE_FILE = path.join(__dirname, '.e2e-state.json');

const DEV_USER_1 = {
  id: 'a0000000-0000-4000-8000-000000000001',
  phone: '+919000000001',
};
const DEV_USER_2 = {
  id: 'a0000000-0000-4000-8000-000000000002',
  phone: '+919000000002',
};

let passed = 0;
let failed = 0;

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function mergeState(updates) {
  const state = { ...loadState(), ...updates };
  saveState(state);
  return state;
}

function logStep(title) {
  console.log(`\n  → ${title}`);
}

function pass(name) {
  passed += 1;
  console.log(`    ✓ ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`    ✗ ${name}`);
  if (detail) console.error(`      ${detail}`);
}

function assert(condition, name, detail) {
  if (condition) pass(name);
  else fail(name, detail);
}

async function checkServer() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const body = await res.json();
    if (res.status !== 200 || body.status !== 'healthy') {
      throw new Error(`Server unhealthy: ${JSON.stringify(body)}`);
    }
    return true;
  } catch (err) {
    console.error(`\n❌ Cannot reach API at ${BASE_URL}`);
    console.error('   Start the server first: npm run dev\n');
    console.error(`   ${err.message}\n`);
    return false;
  }
}

async function api(method, urlPath, options = {}) {
  const { body, token, query } = options;
  let url = `${BASE_URL}${urlPath}`;

  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null),
    );
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: res.status, data, ok: res.ok };
}

async function apiExpect(method, urlPath, options, expectedStatuses) {
  const statuses = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  const result = await api(method, urlPath, options);
  const ok = statuses.includes(result.status);
  return { ...result, ok };
}

async function devLogin() {
  const res = await apiExpect('POST', '/api/v1/auth/dev-login', {}, 200);
  if (!res.ok || !res.data?.data?.tokens?.accessToken) {
    throw new Error('dev-login failed. Run: npm run db:seed:dev');
  }
  return {
    token: res.data.data.tokens.accessToken,
    user: res.data.data.user,
  };
}

async function ensureDevUsers() {
  const migrationScript = path.join(__dirname, '..', 'run-migration.js');
  const root = path.join(__dirname, '..', '..');
  execSync(`node "${migrationScript}" 7.seed_dev_user.sql`, { stdio: 'pipe', cwd: root });
  execSync(`node "${migrationScript}" 8.seed_dev_user_2.sql`, { stdio: 'pipe', cwd: root });
}

function printSummary(moduleName) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${moduleName}: ${passed} passed, ${failed} failed`);
  console.log(`${'─'.repeat(50)}\n`);
  if (failed > 0) process.exit(1);
}

function resetCounters() {
  passed = 0;
  failed = 0;
}

module.exports = {
  BASE_URL,
  STATE_FILE,
  DEV_USER_1,
  DEV_USER_2,
  loadState,
  saveState,
  mergeState,
  logStep,
  pass,
  fail,
  assert,
  checkServer,
  api,
  apiExpect,
  devLogin,
  ensureDevUsers,
  printSummary,
  resetCounters,
};
