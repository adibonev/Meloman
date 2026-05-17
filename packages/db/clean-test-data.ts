// Remove namespaced test data that leaked into a shared database.
//
// The Playwright `full` suite and the bulk load seed both write rows
// with fixed, recognizable namespaces:
//   - stories / quizzes / sponsors titled "E2E ..."
//   - users "e2e-...@example.com" (registration specs)
//   - users "loadtest+...@meloman.local" (db:seed:bulk)
//
// This script deletes ONLY those rows. The real demo seed (3
// @meloman.bg accounts, "Demo Music Quiz", the 5 Meloman articles,
// daily content, badges) has no such prefix, so it is never touched.
// Idempotent: re-running it on a clean DB deletes nothing.
//
//   pnpm --filter @meloman/db db:clean:test
//
// Run it against whichever DATABASE_URL is set. To clean production,
// point .env.local at the production Neon connection string.

import { inArray, like, or } from "drizzle-orm";
import { db } from "./client";
import {
  gameSessions,
  quizzes,
  sponsors,
  stories,
  users,
} from "./schema";

async function main() {
  // Order matters: game_sessions.quiz_id is ON DELETE RESTRICT, so the
  // sessions (and their cascading teams / answers) must go before the
  // E2E quizzes they belong to. quizzes → rounds → questions and
  // sessions → teams → team_members/answers cascade automatically.

  const e2eQuizIds = (
    await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(like(quizzes.title, "E2E %"))
  ).map((r) => r.id);

  let sessionsDeleted = 0;
  if (e2eQuizIds.length > 0) {
    const rows = await db
      .delete(gameSessions)
      .where(inArray(gameSessions.quizId, e2eQuizIds))
      .returning({ id: gameSessions.id });
    sessionsDeleted = rows.length;
  }

  const quizzesDeleted = (
    await db
      .delete(quizzes)
      .where(like(quizzes.title, "E2E %"))
      .returning({ id: quizzes.id })
  ).length;

  const storiesDeleted = (
    await db
      .delete(stories)
      .where(like(stories.title, "E2E %"))
      .returning({ id: stories.id })
  ).length;

  const sponsorsDeleted = (
    await db
      .delete(sponsors)
      .where(like(sponsors.name, "E2E %"))
      .returning({ id: sponsors.id })
  ).length;

  // user_progress and user_badges cascade on user delete;
  // team_members.user_id / teams.captain_user_id are ON DELETE SET
  // NULL, so removing test users never orphans real game data.
  const usersDeleted = (
    await db
      .delete(users)
      .where(
        or(
          like(users.email, "e2e-%@example.com"),
          like(users.email, "loadtest+%@meloman.local")
        )
      )
      .returning({ id: users.id })
  ).length;

  console.log("Test data cleanup complete:");
  console.log(`  game_sessions (E2E quizzes): ${sessionsDeleted}`);
  console.log(`  quizzes (E2E %):             ${quizzesDeleted}`);
  console.log(`  stories (E2E %):             ${storiesDeleted}`);
  console.log(`  sponsors (E2E %):            ${sponsorsDeleted}`);
  console.log(`  users (e2e-/loadtest+):      ${usersDeleted}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
