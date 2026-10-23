#!/usr/bin/env node
/*
Save one ChatGPT conversation into ai-logs/chatgpt/<you>/ as a readable Markdown file.

Clemson's ChatGPT Edu accounts cannot export chat history, so each project chat is saved by hand:
open the chat in ChatGPT, click Share, then Copy link; open that link in your browser, select the
whole conversation (Cmd+A on a Mac, Ctrl+A on Windows) and copy it. Then:

    node scripts/save-chatgpt-chat.js --link "https://chatgpt.com/share/..." --topic "intake research"

The script reads the conversation from your clipboard. To read it from a file instead, add
--file path/to/conversation.txt (or pipe the text in). The first time, add --me your-github-username
(remembered in a file Git ignores). Codex runs this for you when you ask it to save a ChatGPT chat.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// A key starts its own token: 'sk-' after a letter, digit, or hyphen is a word (task-, risk-, a URL slug
// like residents-ask-odnr-...), not an OpenAI key (2026-10-23).
const SECRET_PATTERNS = [/(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]{20,}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/,
  /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const SHARE_LINK = /^https:\/\/(chatgpt\.com|chat\.openai\.com)\/share\/[A-Za-z0-9-]+/;
const MIN_CHARS = 200;

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
  try {
    const login = execFileSync('gh', ['api', 'user', '--jq', '.login'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (login) { fs.writeFileSync(marker, login + '\n'); return login; }
  } catch (e) { /* gh not signed in: fall through */ }
  fail('First run: add --me your-github-username');
}

function readClipboard() {
  const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  try {
    if (process.platform === 'darwin') return run('pbpaste', []);
    if (process.platform === 'win32') {
      return run('powershell', ['-NoProfile', '-Command',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Clipboard -Raw']);
    }
    try { return run('wl-paste', ['--no-newline']); } catch (e) { return run('xclip', ['-selection', 'clipboard', '-o']); }
  } catch (e) {
    return '';
  }
}

function readConversation(a) {
  if (typeof a.file === 'string') {
    const f = a.file.replace(/^~(?=$|[\\/])/, os.homedir());
    if (!fs.existsSync(f)) fail(`Cannot find ${f}.`);
    return fs.readFileSync(f, 'utf8');
  }
  if (!process.stdin.isTTY) {
    try { const piped = fs.readFileSync(0, 'utf8'); if (piped.trim()) return piped; } catch (e) { /* no stdin */ }
  }
  return readClipboard();
}

function slug(s) { return (s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)) || 'chat'; }

function main() {
  const a = args(process.argv.slice(2));
  if (typeof a.topic !== 'string' || !a.topic.trim()) {
    fail('Usage: node scripts/save-chatgpt-chat.js --link "https://chatgpt.com/share/..." --topic "short topic" [--file conversation.txt]');
  }
  const link = typeof a.link === 'string' ? a.link.trim() : '';
  if (link && !SHARE_LINK.test(link)) fail(`"${link}" is not a ChatGPT share link. In ChatGPT, open the chat, click Share, then Copy link.`);
  const root = a.repo ? path.resolve(a.repo) : path.resolve(__dirname, '..');
  const me = whoAmI(root, a.me);

  const text = readConversation(a).replace(/\r\n/g, '\n').trim();
  if (text.length < MIN_CHARS) {
    fail('No conversation found (the clipboard or file is empty or very short). Open the share link in your browser, ' +
      'select the whole conversation (Cmd+A or Ctrl+A), copy it, and run this again. Or save it to a file and add --file.');
  }
  if (SECRET_PATTERNS.some(re => re.test(text))) {
    fail('NOT SAVED: the conversation appears to contain a password or key. Remove it before saving, or ask Dr. Tripp.');
  }

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join(root, 'ai-logs', 'chatgpt', me);
  fs.mkdirSync(outDir, { recursive: true });
  let base = path.join(outDir, `${today}_${slug(a.topic)}`);
  for (let n = 2; fs.existsSync(base + '.md'); n++) base = path.join(outDir, `${today}_${slug(a.topic)}-${n}`);

  const header = [
    `# ${a.topic.trim()}`, '',
    `- Saved: ${today} by ${me}`,
    `- Share link: ${link || '(none given)'}`,
    `- Source: ChatGPT (Clemson ChatGPT Edu), copied from the shared conversation`, '',
    '---', '',
  ];
  fs.writeFileSync(base + '.md', header.join('\n') + '\n' + text + '\n', 'utf8');
  const rel = path.relative(root, base + '.md');
  console.log(`Saved ${rel} (${text.split(/\s+/).length} words).`);
  if (!link) console.log('No share link was given. Add one next time with --link, so a teammate can open the original chat.');
  console.log('Next: commit this file on a branch and open a pull request.');
}

main();
