# AGENTS.md — AI Agents in the Meloman Project

This document describes how AI agents are used during the development of **Meloman**. It is a required deliverable for the SoftUni course "Full Stack Apps with AI" and a transparency record for anyone reading the repository.

> **One-line summary:** AI agents accelerate development, but every architectural decision, product invariant, and merged commit is reviewed by a human (Adi Bonev).

---

## 1. Agents in active use

| Agent | Purpose | Where it runs |
|---|---|---|
| **Claude Code (Opus 4.7)** | Pair-programmer, architecture sounding board, code review, debugging, doc writing | Anthropic's official CLI / VS Code extension |
| **GitHub Copilot (Pro, Student)** | Inline autocompletion while typing | VS Code |

No other agents (no auto-merge bots, no autonomous deploy agents, no LLM-driven CI checks). Humans approve every PR.

---

## 2. The role of `CLAUDE.md`

[`CLAUDE.md`](CLAUDE.md) at the repo root is the **single source of truth** for AI context. It contains:

- Developer profile (skill level, communication preferences)
- Product specification (live quiz + daily engagement + stories)
- Tech stack (mandated by SoftUni curriculum, locked)
- Database schema (15 tables)
- API surface (30+ REST endpoints)
- Coding conventions (TypeScript strict, Drizzle, Server Components by default, etc.)
- Product invariants that AI must respect (captain-only submit, server-authoritative timing, audio clip legal limits, image source tracking)
- Forbidden alternatives (e.g., Prisma, Socket.io, Material UI — refuse if asked)

Any time the AI is asked to write code, it reads `CLAUDE.md` first. If something contradicts the file, the file wins. Inconsistencies are flagged for human review, not silently resolved.

---

## 3. What AI is used for

### Code generation
- Drizzle schemas and migrations
- Next.js routes (pages, layouts, API routes, server actions)
- shadcn/ui component composition
- Zod validation schemas
- Pusher event wiring (when Sprint 3 lands)

### Code review and refactoring
- Reviewing diffs before commit
- Spotting violations of `CLAUDE.md` invariants
- Suggesting smaller, more focused commits

### Architecture and planning
- Sprint planning and task decomposition
- Trade-off analysis (e.g., signed-URL audio vs. public bucket)
- Naming and file structure decisions

### Documentation
- This file, `README.md`, inline JSDoc, and migration commit messages

### Translation and i18n
- Drafting Bulgarian and English message files (`messages/bg.json`, `messages/en.json`)

---

## 4. What AI is **not** used for

- **Final architectural decisions.** AI proposes, the human decides.
- **Choosing the tech stack.** Stack is dictated by the SoftUni curriculum (see [`CLAUDE.md`](CLAUDE.md) §2).
- **Writing the SoftUni capstone defense.** That is solely the developer's work.
- **Auto-merging PRs.** Every PR is reviewed by Adi before merge.
- **Generating production secrets, API keys, or credentials.**
- **Producing legal text** (DMCA policy, ToS, privacy policy will be human-written or human-reviewed by a lawyer).

---

## 5. Prompting style

The collaboration follows a few rules baked into `CLAUDE.md`:

1. **Bulgarian for chat, English for code.** Discussions and explanations happen in Bulgarian; identifiers, comments, and commit messages are English.
2. **Explain *why*, not just *what*.** Adi is learning, not just executing — every non-trivial change must include reasoning.
3. **Small focused diffs.** No 500-line dumps. One concept per change.
4. **Push back on bad ideas.** AI is instructed to refuse unsafe shortcuts (skipping migrations, committing secrets, using forbidden libraries).
5. **Ask when unclear.** If a requirement is ambiguous, the AI asks rather than guessing.

---

## 6. Guardrails (refusals built into `CLAUDE.md` §11)

The AI is instructed to refuse certain requests, even from the developer:

- ❌ Adding forbidden libraries (Prisma, Socket.io, Express, Material UI, Redux)
- ❌ Streaming full songs (copyright violation)
- ❌ Using the Spotify Embed widget in quiz UI (Spotify ToS violation)
- ❌ Hardcoding user-facing strings instead of using `next-intl`
- ❌ Using the `any` TypeScript type
- ❌ Skipping Drizzle migrations and writing raw SQL
- ❌ Committing secrets to the repo
- ❌ Disabling TypeScript strict mode
- ❌ Writing JavaScript instead of TypeScript

If such a request is made, the AI refuses, explains why, and proposes an alternative.

---

## 7. Auditability

Every commit message follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`). The git history is the audit trail of what was done and when.

Where AI assistance was substantial (e.g., generating an entire schema or migration), the commit message reflects the change in human terms — not "Claude wrote this." The human committer (Adi) takes ownership of every line that lands on `main`.

---

## 8. Scope and limits

- AI is a tool. It does not own the project.
- AI cannot guarantee correctness — every generated piece is read, run, and tested before merge.
- When AI produces code that violates `CLAUDE.md` (it happens), the human catches it on review.
- This document evolves alongside the project. Last updated at capstone submission state (Sprints 1–3 + Stories/Daily/Admin/Mobile shipped).
