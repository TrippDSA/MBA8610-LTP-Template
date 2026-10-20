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
- Never put a password, API key, or personal data about real people into code, data, or commits. Use made-up sample data. The one exception is the Team table in `README.md`, where each teammate lists their own name, GitHub username, Clemson email, and best way to reach them.

## Git and GitHub
The team does not use GitHub Desktop. You run Git and the GitHub CLI (`gh`) for them, and they are learning the commands by reading what you run.
- Say in plain language what each Git command does before or as you run it.
- Work on a branch named for the work. Do not commit to `main` unless the user explicitly asks for that. If the user asks for a commit while on `main`, suggest starting a branch first.
- Before committing, show `git status` and point out any file the user may not expect, especially data about real people, a `.zip`, or anything that looks like a password or key.
- Open pull requests with `gh pr create`, with a title and a short description of what changed and why.
- Never merge a pull request. A teammate other than the author reviews and merges it on github.com.
- Never force-push. Before any command that discards work (`git reset --hard`, `git checkout -- .`, `git clean`), explain what would be lost and ask first.
- If a push is rejected because GitHub has newer changes, pull them, resolve any conflict with the user, and push again.

## Before the session ends
Remind the user to save this session for the team: run `node scripts/save-codex-sessions.js`, then commit and push on the current branch. If the session settled one of the four decisions, suggest an entry for `docs/decisions.md`; the team writes it.
