# Instructions for Codex in this repository

Codex reads this file automatically when it works in this folder. Keep it in the repository root.

## The project
This is an MBA 8610 (Clemson) team project. The team is building a working Node.js system that runs one real business process and records data at every step (Phase 1, Automate), then an analytical module that turns that data into findings (Phase 2, Informate). Read `README.md` for the process this team chose and `docs/decisions.md` for decisions already made.

## Who decides
The team members are managers directing the build, not software engineers. They make four calls: what to build, what "good enough" means, who is accountable, and when to stop. When a request leaves one of those open, ask the user instead of choosing for them, and say what the options are in plain language.

## How to build
- Node.js with few dependencies. Plain Node, or a small framework (Express, Fastify, Hono). No heavy enterprise frameworks.
- Persist data at every step of the process: an embedded SQLite database is preferred; JSON or CSV files are acceptable. Everything runs on a laptop. No cloud services.
- Keep `npm start` working, and update the "How to run the system" steps in `README.md` whenever they change.
- Explain each change in plain language: what changed, why, and how to check that it works.
- Never put a password, API key, or personal data about real people into code, data, or commits. Use made-up sample data.

## Before the session ends
Remind the user to save this session for the team: run `node scripts/save-codex-sessions.js`, then commit and push in GitHub Desktop. If the session settled one of the four decisions, suggest an entry for `docs/decisions.md`; the team writes it.
