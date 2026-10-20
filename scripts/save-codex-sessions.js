#!/usr/bin/env node
/*
Copy your Codex sessions for THIS project into ai-logs/codex/<you>/ so teammates can read them.

Codex saves every session on your own computer (in ~/.codex/sessions on a Mac,
%USERPROFILE%\.codex\sessions on Windows), never in the repository. This script finds the
sessions you ran in this repository's folder, copies each one into the repository, and
writes a readable transcript next to it. Then you ask Codex to commit and push them.

Run it from the repository folder:
    node scripts/save-codex-sessions.js
The first time, tell it your GitHub username (it remembers it in a file Git ignores):
    node scripts/save-codex-sessions.js --me your-github-username

It never reads or copies your Codex login (auth.json) or anything outside the sessions folder.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const SECRET_PATTERNS = [/sk-[A-Za-z0-9_-]{20,}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/,
  /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
  }
  return out;
}

function real(p) { try { return fs.realpathSync(p); } catch (e) { return path.resolve(p); } }

function norm(p) {
  const r = real(p);
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

function inside(child, parent) {
  const rel = path.relative(norm(parent), norm(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function whoAmI(root, given) {
  const marker = path.join(root, '.ai-logs-me');
  if (typeof given === 'string' && given.trim()) { fs.writeFileSync(marker, given.trim() + '\n'); return given.trim(); }
  if (fs.existsSync(marker)) return fs.readFileSync(marker, 'utf8').trim();
  console.error('First run: tell me your GitHub username, for example:  node scripts/save-codex-sessions.js --me jsmith');
  process.exit(1);
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/^rollout-.*\.jsonl$/.test(e.name)) yield p;
  }
}

function parseLines(raw) {
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (e) { /* skip a partial line */ }
  }
  return out;
}

function sessionMeta(records) {
  const m = records.find(d => d.type === 'session_meta');
  return (m && m.payload) || {};
}

// Everything a person or tool wrote, minus Codex's encrypted reasoning (random text that can look like a key).
function scannable(records) {
  const strip = o => Array.isArray(o) ? o.map(strip)
    : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'encrypted_content').map(([k, v]) => [k, strip(v)]))
    : o;
  return records.map(r => JSON.stringify(strip(r))).join('\n');
}

// Codex adds setup blocks (environment, permissions, AGENTS.md) as if the user typed them.
function isContextInjection(t) {
  const s = t.trimStart();
  return s.startsWith('<') || s.startsWith('# AGENTS.md instructions');
}

function textOf(content) {
  return (content || []).filter(c => c && typeof c === 'object' && c.text).map(c => c.text).join('\n').trim();
}

function transcript(records, meta) {
  const lines = [`# Codex session ${meta.id || ''}`, '', `- Started: ${meta.timestamp || ''}`, `- Folder: ${meta.cwd || ''}`,
    `- Started from: ${meta.originator || ''}`, ''];
  for (const d of records) {
    if (d.type !== 'response_item') continue;
    const p = d.payload || {};
    if (p.type === 'message' && (p.role === 'user' || p.role === 'assistant')) {
      const t = textOf(p.content);
      if (!t || (p.role === 'user' && isContextInjection(t))) continue;
      lines.push(`## ${p.role === 'user' ? 'You' : 'Codex'}`, '', t, '');
    } else if (p.type === 'function_call' || p.type === 'custom_tool_call') {
      const a = String(p.arguments || p.input || '').slice(0, 1500);
      lines.push(`> Codex ran a tool (${p.name || 'tool'}):`, '', '```', a, '```', '');
    }
  }
  return lines.join('\n');
}

function main() {
  const a = args(process.argv.slice(2));
  const root = a.repo ? real(a.repo) : real(path.join(__dirname, '..'));
  const me = a['dry-run'] ? (a.me || 'dry-run') : whoAmI(root, a.me);
  const home = a['codex-home'] || process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const sessions = path.join(home, 'sessions');
  if (!fs.existsSync(sessions)) {
    console.error(`No Codex sessions folder at ${sessions}. Have you used Codex on this computer yet?`);
    process.exit(1);
  }
  const outDir = path.join(root, 'ai-logs', 'codex', me);
  if (!a['dry-run']) fs.mkdirSync(outDir, { recursive: true });
  let copied = 0, updated = 0, secret = 0;
  for (const src of [...walk(sessions)].sort()) {
    const raw = fs.readFileSync(src, 'utf8');
    const records = parseLines(raw);
    const meta = sessionMeta(records);
    if (!meta.cwd || !inside(meta.cwd, root)) continue;
    const scan = scannable(records);
    if (SECRET_PATTERNS.some(re => re.test(scan))) {
      secret++;
      console.log(`SKIPPED (looks like it contains a password or key; remove it from the session first): ${src}`);
      continue;
    }
    const dest = path.join(outDir, path.basename(src));
    const exists = fs.existsSync(dest);
    if (exists && fs.statSync(dest).size === fs.statSync(src).size) continue;
    if (a['dry-run']) { console.log(`would save: ${path.basename(src)} (${meta.originator || ''})`); exists ? updated++ : copied++; continue; }
    fs.copyFileSync(src, dest);
    fs.writeFileSync(dest.replace(/\.jsonl$/, '.md'), transcript(records, meta), 'utf8');
    exists ? updated++ : copied++;
  }
  console.log(`${a['dry-run'] ? '[dry run] ' : ''}Saved to ${path.relative(root, outDir)}: ${copied} new session(s), ${updated} updated.`);
  if (secret) console.log(`${secret} session(s) skipped because they appear to contain a secret.`);
  if (copied || updated) console.log('Now ask Codex to commit and push these files on your current branch.');
  else console.log("Nothing new. If you expected sessions, make sure Codex was working in this repository's folder.");
}

main();
