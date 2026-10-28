# Instructions for Codex in this repository

Codex reads this file automatically when it works in this folder. Keep it in the repository root.

## The project
This is an MBA 8610 (Clemson) team project. The team is building a working Node.js system that runs one real business process and records data at every step (Phase 1, Automate), then an analytical module that turns that data into findings (Phase 2, Informate). Read `README.md` for the process this team chose and `docs/decisions.md` for decisions already made. Before starting any work, read `instructions/` (the course's project instructions and rubrics) and the Markdown copies in `deliverables/` (what the team has turned in), so the work fits what the project asks for.

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
- Start each new piece of work from the latest `main`: switch to `main`, pull, then create the branch. Do not reuse an old branch for new work. A branch holds only what was on `main` when it started, so an old branch hides everything teammates have merged since.
- If the user wants to keep working on an existing branch, pull `main` first, then merge `main` into the branch. Resolve any conflict with the user.
- After a pull request merges, switch back to `main`, pull, and offer to delete the merged branch.
- Before committing, show `git status` and point out any file the user may not expect, especially data about real people, a `.zip`, or anything that looks like a password or key.
- Open pull requests with `gh pr create`, with a title and a short description of what changed and why.
- Never merge a pull request. A teammate other than the author reviews and merges it on github.com.
- Never force-push. Before any command that discards work (`git reset --hard`, `git checkout -- .`, `git clean`), explain what would be lost and ask first.
- If a push is rejected because GitHub has newer changes, pull them, resolve any conflict with the user, and push again.

## Saving ChatGPT chats
Codex sessions are saved automatically (below). A chat in regular ChatGPT, outside Codex, is not, and Clemson's ChatGPT Edu accounts cannot export chat history. When the user asks to save one of those chats:
1. If they have not given you the chat's share link and a short topic, ask for both. To get the link: in ChatGPT, open the chat, click **Share**, then **Copy link**. If they added to the chat after sharing it, they click **Share** again and update the link.
2. Ask them to open the share link in their browser, select the whole conversation (Cmd+A on a Mac, Ctrl+A on Windows), and copy it. Then run `node scripts/save-chatgpt-chat.js --link "<link>" --topic "<topic>"`. The script reads the conversation from the clipboard and saves it to `ai-logs/chatgpt/<their-github-username>/`.
3. If the script cannot read the clipboard, ask the user to paste the conversation into this chat, save it to a temporary file outside the repository, and run the script again with `--file <that file>`. Delete the temporary file afterward.
4. Open the saved file and confirm it holds the conversation, not something else that was on the clipboard. Never edit, shorten, or summarize a saved transcript.
5. If the script stops because the conversation appears to contain a password or key, tell the user and do not save it.
6. Commit the file on a branch and open a pull request, following the Git rules above.

## Saving Codex sessions
The team's Codex conversations are part of the project record. You save them yourself, so the user never has to.
- Before every commit, run `node scripts/save-codex-sessions.js` and include any new or updated files in `ai-logs/codex/` in that commit.
- When the user says they are done for now, save the session the same way, commit, and push, following the Git rules above.
- The script copies only this repository's sessions. If it reports a skipped session (one that appears to contain a password or key), tell the user. If it asks for a GitHub username, ask the user for theirs and rerun it with `--me <username>`.
- If the script warns that sessions were started in a folder that contains the repository, tell the user: those sessions never save on their own, so they should open the repository folder itself in Codex and start a new conversation there. Offer to save each listed session with `--session-id <ID>`, on a branch, following the Git rules above.

## Before the session ends
If the session settled one of the four decisions, suggest an entry for `docs/decisions.md`; the team writes it.
