# Project Group [N]: [the process you are building]

MBA 8610, Clemson University, Fall 2026. Long-Term Project. Instructor: Dr. John Tripp.

## Our process
[Two or three sentences from your D0 brief: the process, who runs it, and what data it produces.]

## Team
| Name | GitHub username | Point of contact for |
|---|---|---|
| | | |

## How to run the system
1. Install Node.js (LTS) if you have not already: https://nodejs.org
2. Get the repository on your computer: GitHub Desktop, **File > Clone repository**.
3. Open a terminal in the repository: GitHub Desktop, **Repository > Open in Terminal** (Mac) or **Open in Command Prompt** (Windows).
4. Install the packages the system uses: `npm install`
5. Start the system: `npm start`

[Keep these steps current. D2 is graded on whether a teammate or Dr. Tripp can run the system from a fresh clone by following them.]

## Folders
| Folder | What goes there |
|---|---|
| `src/` | The Phase 1 system (Node.js). |
| `data/` | Sample input data and the records the system writes when it runs. |
| `analysis/` | The Phase 2 analytical module (Node.js, or Python, R, or a notebook). |
| `docs/` | `working-agreement.md` and `decisions.md`, the four-decisions journal. |
| `deliverables/` | The PDF of each deliverable as submitted (D1 to D4). |
| `ai-logs/` | Each member's saved Codex sessions and project ChatGPT chats. |
| `scripts/` | The two scripts that save AI history into `ai-logs/`. |

## Team rules
- Every change reaches `main` through a pull request that a teammate reviews and merges. No direct commits to `main`.
- After every Codex session: `node scripts/save-codex-sessions.js`, then commit and push.
- Never commit a password, API key, or the ChatGPT export .zip.
