import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { questions, quizzes, rounds, users } from "./schema";

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

const DEMO_QUIZ_TITLE = "Demo Music Quiz";

async function seedUsers() {
  console.log("Seeding users...");
  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

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
}

async function seedDemoQuiz() {
  console.log("\nSeeding demo quiz...");

  // Owner is the seeded super-admin so the quiz shows up in their admin
  // dashboard. We just looked them up — assume present.
  const [creator] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "super-admin@meloman.bg"))
    .limit(1);

  if (!creator) {
    throw new Error("super-admin user missing — user seed must run first");
  }

  // Idempotent: drop any previous demo quiz (cascade clears rounds + questions)
  // before reinserting. Avoids duplicate "Demo Music Quiz" rows on re-run.
  await db.delete(quizzes).where(eq(quizzes.title, DEMO_QUIZ_TITLE));

  const [quiz] = await db
    .insert(quizzes)
    .values({
      creatorId: creator.id,
      title: DEMO_QUIZ_TITLE,
      description:
        "Демонстрационен quiz с по 1 въпрос от текстовите типове. Audio + Image Reveal се добавят ръчно в admin (изискват R2 файлове).",
      theme: "modern",
      language: "bg",
      status: "published",
      publishedAt: new Date(),
    })
    .returning({ id: quizzes.id });

  const [round] = await db
    .insert(rounds)
    .values({
      quizId: quiz.id,
      title: "Round 1: Mixed bag",
      orderIndex: 0,
      roundType: "standard",
      introSlideText: "4 въпроса от различни типове, по 1 точка всеки.",
    })
    .returning({ id: rounds.id });

  await db.insert(questions).values([
    {
      roundId: round.id,
      orderIndex: 0,
      questionType: "multiple_choice",
      questionText: "Кой изпълнява песента 'Bohemian Rhapsody'?",
      options: ["Queen", "The Beatles", "Pink Floyd", "Led Zeppelin"],
      correctAnswer: 0,
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
    {
      roundId: round.id,
      orderIndex: 1,
      questionType: "open_text",
      questionText: "Кой е основният вокал на Queen?",
      correctAnswer: "Freddie Mercury",
      acceptableAnswers: [
        "Freddie Mercury",
        "Mercury",
        "Frederick Mercury",
        "Фреди Меркюри",
      ],
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
    {
      roundId: round.id,
      orderIndex: 2,
      questionType: "lyric_blank",
      // 3 blanks → 3 expected words. Points stack: 3 × pointsBase = 3 max.
      questionText: "Mama, just ___ a man, put a ___ against his ___",
      correctAnswer: ["killed", "gun", "head"],
      timeLimitSeconds: 30,
      pointsBase: 1,
    },
    {
      roundId: round.id,
      orderIndex: 3,
      questionType: "decade",
      questionText: "През коя година излиза 'Bohemian Rhapsody'?",
      correctAnswer: 1975,
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  ]);

  console.log(`  ✓ "${DEMO_QUIZ_TITLE}" (1 round, 4 questions)`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check .env.local at repo root.");
  }

  await seedUsers();
  await seedDemoQuiz();

  console.log(`\nDone. Password for seeded accounts: ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
