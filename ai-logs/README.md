# AI logs

This folder holds the team's AI history, so every teammate (and Dr. Tripp) can see how the system and the analysis were produced. The four-decisions write-ups cite these transcripts as evidence.

```
ai-logs/
  codex/<github-username>/     Codex sessions: the raw .jsonl and a readable .md transcript for each
  chatgpt/<github-username>/   Project ChatGPT chats: the raw .json and a readable .md transcript for each
```

- Save Codex sessions with `node scripts/save-codex-sessions.js` after every working session.
- Save project ChatGPT chats with `node scripts/save-chatgpt-export.js <export.zip> --tag "[Group N]"` at least once a week.
- Commit and push after saving. Logs are due before every deliverable.
- Never commit a password, API key, or the ChatGPT export .zip itself. The scripts skip anything that looks like a key.
