// Load-volume seed: inserts N synthetic players (default 10,000) so the
// paginated APIs / admin lists can be validated under realistic load
// (SoftUni Scalability: "populate primary tables with at least 10,000
// records"). Separate from the demo seed so it can be run independently
// and re-run safely.
//
//   pnpm --filter @meloman/db db:seed:bulk            # 10,000 users
//   BULK_USERS=25000 pnpm --filter @meloman/db db:seed:bulk

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "./client";
import { users } from "./schema";

const TARGET = Number(process.env.BULK_USERS ?? 10_000);
const BATCH = 1_000;
// One precomputed hash reused for every row: these are throwaway
// load-test accounts (all share the password), so per-row bcrypt would
// just waste minutes for zero security value.
const SHARED_PASSWORD = "loadtest123";

async function main() {
  if (!Number.isFinite(TARGET) || TARGET <= 0) {
    throw new Error(`Invalid BULK_USERS: ${process.env.BULK_USERS}`);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const existing = Number(count);
  console.log(`users table currently has ${existing} rows.`);

  if (existing >= TARGET) {
    console.log(
      `Already at/above ${TARGET}; nothing to do (idempotent).`
    );
    return;
  }

  const toInsert = TARGET - existing;
  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 12);
  const stamp = Date.now();
  let inserted = 0;

  for (let start = 0; start < toInsert; start += BATCH) {
    const size = Math.min(BATCH, toInsert - start);
    const rows = Array.from({ length: size }, (_, i) => {
      const n = start + i;
      return {
        // Unique, namespaced so a re-run never collides with demo users
        // or a previous bulk run.
        email: `loadtest+${stamp}-${n}@meloman.local`,
        passwordHash,
        displayName: `Load Test ${n}`,
        role: "player" as const,
      };
    });

    await db.insert(users).values(rows).onConflictDoNothing();
    inserted += size;
    console.log(`  inserted ${inserted}/${toInsert}`);
  }

  const [{ count: after }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  console.log(`Done. users table now has ${Number(after)} rows.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
