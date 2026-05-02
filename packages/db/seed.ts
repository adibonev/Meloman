import bcrypt from "bcryptjs";
import { db } from "./client";
import { users } from "./schema";

const SEED_PASSWORD = "demo123";
const BCRYPT_ROUNDS = 12;

const SEED_USERS = [
  {
    email: "super-admin@meloman.bg",
    displayName: "Adi Bonev",
    role: "super_admin" as const,
  },
  {
    email: "friend@meloman.bg",
    displayName: "Meloman Co-owner",
    role: "super_admin" as const,
  },
  {
    email: "player@meloman.bg",
    displayName: "Demo Player",
    role: "player" as const,
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check .env.local at repo root.");
  }

  console.log("Seeding users...");

  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

    // Upsert by email — re-running the seed updates the password hash and role
    // so we can always log in with the documented demo credentials.
    await db
      .insert(users)
      .values({
        email: u.email,
        displayName: u.displayName,
        passwordHash,
        role: u.role,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          displayName: u.displayName,
          passwordHash,
          role: u.role,
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

    console.log(`  ✓ ${u.email}  (${u.role})`);
  }

  console.log(`\nDone. Password for all seeded accounts: ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
