#!/usr/bin/env node
/*
Copy your team's ChatGPT conversations from a ChatGPT data export into ai-logs/chatgpt/<you>/.

ChatGPT keeps your chats on OpenAI's servers, not in this repository. When you export your data
(ChatGPT: Settings > Data controls > Export data), OpenAI emails you a .zip that holds ALL of
your chats. This script reads it, keeps only the chats whose title starts with your team tag
(for example "[Team 7]"), and saves each one as JSON plus a readable transcript. Personal or
unrelated chats are never copied.

    node scripts/save-chatgpt-export.js ~/Downloads/the-export.zip --tag "[Team 7]"

You can also point it at the unzipped folder. The first time, add --me your-github-username
(remembered in a file Git ignores). Do not commit the export .zip itself.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const os = require('os');

const SECRET_PATTERNS = [/sk-[A-Za-z0-9_-]{20,}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/,
  /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const CONV_FILE = /(^|\/)conversations[^/]*\.json$/;

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true;
    else out._.push(a);
  }
  return out;
}

function fail(msg) { console.error(msg); process.exit(1); }

function whoAmI(root, given) {
  const marker = path.join(root, '.ai-logs-me');
  if (typeof given === 'string' && given.trim()) { fs.writeFileSync(marker, given.trim() + '\n'); return given.trim(); }
  if (fs.existsSync(marker)) return fs.readFileSync(marker, 'utf8').trim();
  fail('First run: add --me your-github-username');
}

// Minimal zip reader: finds the conversations*.json entries and inflates only those.
// Reads by offset, so a multi-gigabyte export (with images) is never loaded whole.
function readZipEntries(file, wanted) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const read = (pos, len) => { const b = Buffer.alloc(len); fs.readSync(fd, b, 0, len, pos); return b; };
  const tailLen = Math.min(size, 65557);
  const tail = read(size - tailLen, tailLen);
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) fail('That file is not a readable .zip. Try unzipping it and pointing the script at the folder.');
  let count = tail.readUInt16LE(eocd + 10), cdSize = tail.readUInt32LE(eocd + 12), cdOff = tail.readUInt32LE(eocd + 16);
  if (cdOff === 0xffffffff || count === 0xffff) { // ZIP64
    const loc = eocd - 20;
    if (loc >= 0 && tail.readUInt32LE(loc) === 0x07064b50) {
      const z64 = read(Number(tail.readBigUInt64LE(loc + 8)), 56);
      count = Number(z64.readBigUInt64LE(32)); cdSize = Number(z64.readBigUInt64LE(40)); cdOff = Number(z64.readBigUInt64LE(48));
    }
  }
  const cd = read(cdOff, cdSize);
  const out = [];
  for (let p = 0, n = 0; n < count && p < cd.length; n++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) break;
    const method = cd.readUInt16LE(p + 10);
    let csize = cd.readUInt32LE(p + 20), local = cd.readUInt32LE(p + 42);
    const nameLen = cd.readUInt16LE(p + 28), extraLen = cd.readUInt16LE(p + 30), commentLen = cd.readUInt16LE(p + 32);
    const name = cd.slice(p + 46, p + 46 + nameLen).toString('utf8');
    let usize = cd.readUInt32LE(p + 24);
    const extra = cd.slice(p + 46 + nameLen, p + 46 + nameLen + extraLen);
    for (let e = 0; e + 4 <= extra.length;) { // ZIP64 extended sizes and offset
      const id = extra.readUInt16LE(e), len = extra.readUInt16LE(e + 2);
      if (id === 0x0001) {
        let q = e + 4;
        if (usize === 0xffffffff) { usize = Number(extra.readBigUInt64LE(q)); q += 8; }
        if (csize === 0xffffffff) { csize = Number(extra.readBigUInt64LE(q)); q += 8; }
        if (local === 0xffffffff) { local = Number(extra.readBigUInt64LE(q)); }
      }
      e += 4 + len;
    }
    if (wanted.test(name)) {
      const lh = read(local, 30);
      const start = local + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
      const data = read(start, csize);
      const body = method === 0 ? data : method === 8 ? zlib.inflateRawSync(data) : fail(`Unsupported compression in ${name}.`);
      out.push([name, body.toString('utf8')]);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  fs.closeSync(fd);
  return out.sort((x, y) => x[0].localeCompare(y[0]));
}

function loadConversations(src) {
  src = src.replace(/^~(?=$|[\\/])/, os.homedir());
  if (!fs.existsSync(src)) fail(`Cannot find ${src}.`);
  let texts = [];
  if (fs.statSync(src).isDirectory()) {
    texts = fs.readdirSync(src).filter(n => /^conversations[^/]*\.json$/.test(n)).sort().map(n => fs.readFileSync(path.join(src, n), 'utf8'));
  } else if (/\.zip$/i.test(src)) {
    texts = readZipEntries(src, CONV_FILE).map(e => e[1]);
  } else {
    texts = [fs.readFileSync(src, 'utf8')];
  }
  if (!texts.length) fail('No conversations.json found. Is that the ChatGPT export?');
  return texts.flatMap(t => JSON.parse(t));
}

// Walk from the conversation's current node back to the root, so edited branches are not mixed in.
function orderedMessages(conv) {
  const mapping = conv.mapping || {};
  const chain = [];
  for (let node = conv.current_node; node && mapping[node]; node = mapping[node].parent) chain.push(mapping[node]);
  const out = [];
  for (const n of chain.reverse()) {
    const m = n.message || {};
    const role = (m.author || {}).role;
    const content = m.content || {};
    let text = (content.parts || []).filter(Boolean).map(p => typeof p === 'string' ? p : (p.text || '[non-text content]')).join('\n');
    if (!text && content.text) text = content.text;
    if (['user', 'assistant', 'tool'].includes(role) && text.trim()) out.push([role, text.trim()]);
  }
  return out;
}

function slug(s) { return (s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)) || 'chat'; }

function main() {
  const a = args(process.argv.slice(2));
  if (!a._[0] || typeof a.tag !== 'string') fail('Usage: node scripts/save-chatgpt-export.js <export.zip or folder> --tag "[Team 7]"');
  const root = a.repo ? path.resolve(a.repo) : path.resolve(__dirname, '..');
  const me = whoAmI(root, a.me);
  const convs = loadConversations(a._[0]);
  const tag = a.tag.trim().toLowerCase();
  const mine = convs.filter(c => (c.title || '').trim().toLowerCase().startsWith(tag));
  if (!mine.length) fail(`Found ${convs.length} chats, none titled starting with "${a.tag}". Rename your project chats in ChatGPT, export again, and rerun.`);
  const outDir = path.join(root, 'ai-logs', 'chatgpt', me);
  fs.mkdirSync(outDir, { recursive: true });
  let saved = 0, skipped = 0;
  for (const c of mine) {
    const raw = JSON.stringify(c, null, 1);
    if (SECRET_PATTERNS.some(re => re.test(raw))) { skipped++; console.log(`SKIPPED (looks like it contains a password or key): ${c.title}`); continue; }
    const when = new Date((c.create_time || 0) * 1000).toISOString().slice(0, 10);
    const base = path.join(outDir, `${when}_${slug(c.title || '')}`);
    fs.writeFileSync(base + '.json', raw, 'utf8');
    const lines = [`# ${c.title}`, '', `- Started: ${when}`, `- Conversation id: ${c.conversation_id || c.id || ''}`, ''];
    for (const [role, text] of orderedMessages(c)) lines.push(`## ${role === 'user' ? 'You' : role === 'assistant' ? 'ChatGPT' : 'Tool output'}`, '', text, '');
    fs.writeFileSync(base + '.md', lines.join('\n'), 'utf8');
    saved++;
  }
  console.log(`Saved ${saved} of ${mine.length} tagged chat(s) to ${path.relative(root, outDir)} (out of ${convs.length} chats in the export).`);
  if (skipped) console.log(`${skipped} skipped because they appear to contain a secret.`);
  console.log('Now commit and push in GitHub Desktop. Do not commit the export .zip.');
}

main();
