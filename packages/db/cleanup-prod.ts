// One-off production cleanup (owner-requested 2026-05-21).
//
// Deletes a specific set of test quizzes and test users. NOT idempotent
// in spirit but safe to re-run: missing rows simply match nothing.
//
//   pnpm --filter @meloman/db db:cleanup:prod
//
// Runs against whatever DATABASE_URL is configured (.env.local points
// at production). DESTRUCTIVE + irreversible — review QUIZ_TITLES and
// USER_EMAILS below before running.

import { eq, inArray, ne } from "drizzle-orm";
import { db } from "./client";
import {
  gameSessions,
  quizzes,
  stories,
  users,
} from "./schema";

// Exact quiz titles to remove (rounds/questions/quiz_sponsors cascade;
// their game_sessions are deleted first because quiz_id is RESTRICT).
const QUIZ_TITLES = ["test finals", "quiz May", "Demo Music Quiz", "test2"];

// Named (non-anonymous) users to remove. Every anon-*@meloman.local
// guest account is removed too (matched by regex in the filter below).
const USER_EMAILS = [
  "bonev@gmail.com",
  "test4@gmail.com",
  "test2@gmail.com",
];

// Content owned by a deleted user is reassigned here instead of being
// destroyed — so unrequested quizzes/stories survive. Must exist.
const KEEPER_EMAIL = "super-admin@meloman.bg";

// Demo accounts are never touched, even if listed by mistake.
const PROTECTED_EMAILS = [
  "super-admin@meloman.bg",
  "friend@meloman.bg",
  "player@meloman.bg",
];

async function main() {
  // --- 1. Delete the named quizzes -------------------------------------
  const quizRows = await db
    .select({ id: quizzes.id, title: quizzes.title })
    .from(quizzes)
    .where(inArray(quizzes.title, QUIZ_TITLES));
  const quizIds = quizRows.map((r) => r.id);

  let quizSessionsDeleted = 0;
  if (quizIds.length > 0) {
    quizSessionsDeleted = (
      await db
        .delete(gameSessions)
        .where(inArray(gameSessions.quizId, quizIds))
        .returning({ id: gameSessions.id })
    ).length;
  }
  const quizzesDeleted =
    quizIds.length > 0
      ? (
          await db
            .delete(quizzes)
            .where(inArray(quizzes.id, quizIds))
            .returning({ id: quizzes.id })
        ).length
      : 0;

  // --- 2. Resolve the users to delete ----------------------------------
  const targetUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(ne(users.email, KEEPER_EMAIL));
  const toDelete = targetUsers.filter(
    (u) =>
      !PROTECTED_EMAILS.includes(u.email) &&
      (USER_EMAILS.includes(u.email) ||
        /^anon-.*@meloman\.local$/.test(u.email))
  );
  const deleteIds = toDelete.map((u) => u.id);

  if (deleteIds.length === 0) {
    console.log("Cleanup complete:");
    console.log(`  game_sessions (named quizzes): ${quizSessionsDeleted}`);
    console.log(`  quizzes:                       ${quizzesDeleted}`);
    console.log(`  users:                         0 (no matches)`);
    return;
  }

  // --- 3. Free up RESTRICT references before deleting the users --------
  const [keeper] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, KEEPER_EMAIL))
    .limit(1);
  if (!keeper) {
    throw new Error(
      `Keeper account ${KEEPER_EMAIL} not found — run db:seed first so owned content can be reassigned instead of lost.`
    );
  }

  // Sessions these users HOST (host_id RESTRICT) — delete them.
  const hostedSessionsDeleted = (
    await db
      .delete(gameSessions)
      .where(inArray(gameSessions.hostId, deleteIds))
      .returning({ id: gameSessions.id })
  ).length;

  // Quizzes / stories they OWN (creator_id / author_id RESTRICT) —
  // reassign to the keeper so unrequested content is not destroyed.
  const quizzesReassigned = (
    await db
      .update(quizzes)
      .set({ creatorId: keeper.id })
      .where(inArray(quizzes.creatorId, deleteIds))
      .returning({ id: quizzes.id })
  ).length;
  const storiesReassigned = (
    await db
      .update(stories)
      .set({ authorId: keeper.id })
      .where(inArray(stories.authorId, deleteIds))
      .returning({ id: stories.id })
  ).length;

  // --- 4. Delete the users (progress/badges cascade; team refs NULL) ---
  const usersDeleted = (
    await db
      .delete(users)
      .where(inArray(users.id, deleteIds))
      .returning({ id: users.id })
  ).length;

  console.log("Cleanup complete:");
  console.log(`  game_sessions (named quizzes): ${quizSessionsDeleted}`);
  console.log(`  quizzes:                       ${quizzesDeleted}`);
  console.log(`  game_sessions (hosted by users): ${hostedSessionsDeleted}`);
  console.log(`  quizzes reassigned to keeper:  ${quizzesReassigned}`);
  console.log(`  stories reassigned to keeper:  ${storiesReassigned}`);
  console.log(`  users deleted:                 ${usersDeleted}`);
  console.log(
    `  (deleted: ${toDelete.map((u) => u.email).join(", ")})`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
