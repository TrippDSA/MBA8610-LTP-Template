# AI logs

This folder holds the team's AI history, so every teammate (and Dr. Tripp) can see how the system and the analysis were produced. The four-decisions write-ups cite these transcripts as evidence.

```
ai-logs/
  codex/<github-username>/     Codex sessions: the raw .jsonl and a readable .md transcript for each
  chatgpt/<github-username>/   Project ChatGPT chats: one .md transcript each, starting with the chat's share link
```

- Save Codex sessions with `node scripts/save-codex-sessions.js` after every working session.
- Save each project ChatGPT chat by asking Codex to "save my ChatGPT chat." Codex follows the steps in `AGENTS.md` and runs `scripts/save-chatgpt-chat.js` (Clemson's ChatGPT Edu accounts cannot export chat history).
- Commit and push after saving. Logs are due before every deliverable.
- Never commit a password or API key. The scripts refuse anything that looks like one.
