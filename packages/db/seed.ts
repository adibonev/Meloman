import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { eq, notInArray } from "drizzle-orm";
import { db } from "./client";
import {
  badges,
  dailyContent,
  questions,
  quizzes,
  rounds,
  stories,
  userBadges,
  userProgress,
  users,
} from "./schema";
import { uploadToR2 } from "./r2-seed";
import { BADGES } from "./seed-badges";

const SEED_PASSWORD = "demo123";
const BCRYPT_ROUNDS = 12;

// Friend-provided seed content lives outside the repo (large media).
const CONTENT_DIR = "C:\\Bonev\\seed meloman";

const SEED_USERS = [
  { email: "super-admin@meloman.bg", displayName: "Adi Bonev", role: "super_admin" as const },
  { email: "friend@meloman.bg", displayName: "Meloman Co-owner", role: "super_admin" as const },
  { email: "player@meloman.bg", displayName: "Demo Player", role: "player" as const },
];

const DEMO_QUIZ_TITLE = "Demo Music Quiz";
const FULL_QUIZ_TITLE = "Меломан: пълен куиз";

function p(...paras: string[]): string {
  return paras.map((t) => `<p>${t}</p>`).join("");
}

// Real Meloman editorial content (5 articles provided by the page owner).
const SEED_STORIES = [
  {
    slug: "slavi-trifonov-ku-ku-bend",
    title: "Слави Трифонов и Ку-Ку Бенд",
    subtitle: "Скучните статистики на един феномен",
    artistName: "Слави Трифонов",
    year: 2015,
    body: p(
      "Думите за тях никога няма да са достатъчни. Затова ще се обърнем към сигурните доказателства за успех, а именно — скучните статистики.",
      "23 албума, 300 песни, стотици концерти, 13 турнета (1 от които в САЩ). На 25 април 2015 г. концертът в зала „Арена Армеец“ с около 17 хил. души поставя рекорд за най-бързо разпродаване на цялата зала — само за 9 часа.",
      "На 25 септември 2015 вторият им концерт за годината е на Националния стадион „Васил Левски“. 70 хил. билета се изкупуват за 8 часа. Концертът се провежда при изключително дъждовно време, но стадионът остава пълен до последната песен. Или просто казано — няма как да си българин и да не си танцувал на поне 1 песен на Слави Трифонов и Ку-Ку Бенд."
    ),
  },
  {
    slug: "rammstein-du-riechst-so-gut",
    title: "Rammstein: 30 години „Du Riechst So Gut“",
    subtitle: "Отражение на счупеното общество",
    artistName: "Rammstein",
    year: 1995,
    body: p(
      "„Du Riechst So Gut“ е първият сингъл на групата и този август се навършват 30 години от издаването му. Албумът е „Herzeleid“ (1995 г.), а причината за излизането му е участие в музикален конкурс, който групата печели само година след сформирането си.",
      "Героите от далечната 1994 година са си същите: Тил, Паул, Флейк, Оли, Рихард и Шнайди. Запитани как пазят толкова дълго пълен състав, те с насмешка отговарят — терапия.",
      "Комбинацията от тежки повтарящи се рифове, електронни звуци и драматичен баритонов глас на немски изгражда разпознаваемия стил. Ерата на кратките видеоклипове съживи любовта към групата — „Sonne“ стана втората най-слушана след вечния хит „Du hast“."
    ),
  },
  {
    slug: "leonard-cohen-you-want-it-darker",
    title: "Leonard Cohen: „You Want It Darker“",
    subtitle: "I am ready, my Lord",
    artistName: "Leonard Cohen",
    year: 2016,
    body: p(
      "За цели шест десетилетия Леонард Коен разкрива душата си пред света чрез поезията и музиката. Само 17 дни преди смъртта си (2016 г.) той успява да издаде албума „You Want It Darker“.",
      "След влошаване на здравето му синът на Коен превръща къщата им в домашно студио. Сякаш знаейки какво предстои, Леонард застава пред микрофона и отговаря — „Готов съм“.",
      "Едноименната песен е обръщение към Всевишния. Смирен и готов за неизбежното, Коен не изневерява на стила си: рецитира, но не точно; пее, но не точно. Посмъртно изпълнението печели „Грами“ за най-добро рок изпълнение (2018 г.)."
    ),
  },
  {
    slug: "the-cranberries-zombie",
    title: "The Cranberries: „Zombie“",
    subtitle: "Когато протестната песен стана химн",
    artistName: "The Cranberries",
    year: 1993,
    body: p(
      "Бомба в кош за боклук отнема живота на две невинни деца. Англия е залята от бомбени атентати, а Долорес О’Риърдън се намира близо до един от тях — 20 март 1993 г.",
      "Авторката решава да напише песен, изразяваща протеста ѝ. Собственият им лейбъл предлага огромни суми, за да не я пускат като сингъл, но Долорес буквално къса чековете.",
      "След смъртта ѝ през 2018 г. отборът по хърлинг от Лимерик приема парчето за свой химн. През 2023 г. „Zombie“ се пее от всеки ирландски фен на ръгбито — клиповете събират милиони гледания."
    ),
  },
  {
    slug: "azis-bulgarska-scena",
    title: "Азис: най-разпознаваемият образ на българската сцена",
    subtitle: "Няма лоша реклама",
    artistName: "Азис",
    year: 2004,
    body: p(
      "„Meloman“ е за музиката, а тя идва под всякакви форми и стилове. Напред за времето си — това със сигурност можем да кажем за него. Изпреварвайки трендовете с години: от екстравагантна визия до сексуална ориентация и етнос.",
      "Първи дръзва да предизвика нормата и с това си проправя път към вечната слава в България. Запитан за цената на тази слава, Азис отговаря — „Времето, тоест животът.“",
      "„Дори и да не ме харесват, дори и да ме мразят, хората знаят какво се случва с мен, защото аз съм навсякъде.“ Честит рожден ден, Васил Боянов — Азис."
    ),
  },
];

// Badge catalog of record: packages/db/seed-badges.ts (imported as BADGES).

// Awarded to the demo player so /profile shows both states (clear + locked).
const DEMO_AWARDED_BADGES = [
  "meloman-novice",
  "first-concert",
  "curious",
  "first-steps",
  "welcome-pack",
  "xp-1k",
];

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

async function getSuperAdminId(): Promise<string> {
  const [creator] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "super-admin@meloman.bg"))
    .limit(1);
  if (!creator) throw new Error("super-admin missing — user seed must run first");
  return creator.id;
}

async function seedStories(authorId: string) {
  console.log("\nSeeding stories...");
  for (const s of SEED_STORIES) {
    const words = s.body
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    await db
      .insert(stories)
      .values({
        authorId,
        slug: s.slug,
        title: s.title,
        subtitle: s.subtitle,
        body: s.body,
        artistName: s.artistName,
        year: s.year,
        decade: Math.floor(s.year / 10) * 10,
        tags: [s.artistName],
        readingTimeMinutes: Math.max(1, Math.round(words / 200)),
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: stories.slug,
        set: { title: s.title, body: s.body, publishedAt: new Date() },
      });
    console.log(`  ✓ ${s.title}`);
  }
}

async function seedDemoQuiz(creatorId: string) {
  console.log("\nSeeding demo quiz (uploading media to R2)...");

  const audioBytes = readFileSync(join(CONTENT_DIR, "МДЖ.mp3"));
  const imageBytes = readFileSync(join(CONTENT_DIR, "Gaga.jpg"));
  const audioKey = await uploadToR2(
    "quiz-audio/seed-michael-jackson.mp3",
    audioBytes,
    "audio/mpeg"
  );
  const imageKey = await uploadToR2(
    "quiz-images/seed-lady-gaga.jpg",
    imageBytes,
    "image/jpeg"
  );
  console.log("  ✓ media uploaded to R2");

  // Idempotent without deleting the quiz row: a previous demo quiz may be
  // referenced by game_sessions (FK is RESTRICT), so reuse it if present and
  // only refresh its rounds (cascade clears questions). Otherwise insert.
  const [existing] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.title, DEMO_QUIZ_TITLE))
    .limit(1);

  let quiz: { id: string };
  if (existing) {
    await db
      .update(quizzes)
      .set({
        description: "Демонстрационен quiz с всичките 6 типа въпроси.",
        status: "published",
        publishedAt: new Date(),
      })
      .where(eq(quizzes.id, existing.id));
    await db.delete(rounds).where(eq(rounds.quizId, existing.id));
    quiz = existing;
  } else {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        creatorId,
        title: DEMO_QUIZ_TITLE,
        description: "Демонстрационен quiz с всичките 6 типа въпроси.",
        theme: "modern",
        language: "bg",
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: quizzes.id });
    if (!inserted) throw new Error("quiz insert returned no row");
    quiz = inserted;
  }

  const [round] = await db
    .insert(rounds)
    .values({
      quizId: quiz.id,
      title: "Round 1: Mixed bag",
      orderIndex: 0,
      roundType: "standard",
      introSlideText: "6 въпроса от всички типове.",
    })
    .returning({ id: rounds.id });
  if (!round) throw new Error("round insert returned no row");

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
      acceptableAnswers: ["Freddie Mercury", "Mercury", "Фреди Меркюри"],
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
    {
      roundId: round.id,
      orderIndex: 2,
      questionType: "lyric_blank",
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
    {
      roundId: round.id,
      orderIndex: 4,
      questionType: "audio",
      questionText: "Кой изпълнява този откъс?",
      mediaUrl: audioKey,
      correctAnswer: "Michael Jackson",
      acceptableAnswers: ["Michael Jackson", "Майкъл Джексън", "MJ"],
      timeLimitSeconds: 15,
      pointsBase: 1,
    },
    {
      roundId: round.id,
      orderIndex: 5,
      questionType: "image_reveal",
      questionText: "Кой е този артист?",
      mediaUrl: imageKey,
      mediaSource: "Other",
      mediaAttribution: "Seed demo image",
      mediaBlurPx: 24,
      correctAnswer: "Lady Gaga",
      acceptableAnswers: ["Lady Gaga", "Гага", "Stefani Germanotta"],
      timeLimitSeconds: 20,
      pointsBase: 1,
    },
  ]);

  console.log(`  ✓ "${DEMO_QUIZ_TITLE}" (1 round, 6 questions, all types)`);

  await seedFullQuiz(creatorId, audioKey, imageKey);
}

// A separate, full from-start-to-finish quiz. The demo quiz above is
// left untouched. 4 standard rounds, all six question types,
// escalating points in the last round. Text content is authored
// (music trivia facts aren't copyrightable; the short lyric snippets
// are the same fair-use design as the rest of the app). Audio/image
// reuse the demo media already uploaded to R2 — no third-party
// song/image is downloaded (CLAUDE.md §4.6 / §4.7).
async function seedFullQuiz(
  creatorId: string,
  audioKey: string,
  imageKey: string
) {
  type SeedQuestion = typeof questions.$inferInsert;
  const roundDefs: {
    title: string;
    intro: string;
    questions: Omit<SeedQuestion, "roundId" | "orderIndex">[];
  }[] = [
    {
      title: "Рунд 1: Рок класика",
      intro: "4 въпроса, по 1 точка.",
      questions: [
        {
          questionType: "multiple_choice",
          questionText:
            "Коя група издава албума 'The Dark Side of the Moon'?",
          options: ["Pink Floyd", "The Who", "Genesis", "Yes"],
          correctAnswer: 0,
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
        {
          questionType: "open_text",
          questionText:
            "Кой барабанист на Nirvana по-късно основава Foo Fighters?",
          correctAnswer: "Dave Grohl",
          acceptableAnswers: ["Dave Grohl", "Grohl", "Дейв Грол", "Грол"],
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
        {
          questionType: "multiple_choice",
          questionText: "Кой изпълнява 'Smells Like Teen Spirit'?",
          options: ["Nirvana", "Pearl Jam", "Soundgarden", "Alice in Chains"],
          correctAnswer: 0,
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
        {
          questionType: "decade",
          questionText: "През коя година излиза албумът 'Nevermind'?",
          correctAnswer: 1991,
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
      ],
    },
    {
      title: "Рунд 2: Познай текста",
      intro: "Попълни липсващите думи. 1 точка на правилна дума.",
      questions: [
        {
          questionType: "lyric_blank",
          questionText: "We don't need no ___, we don't need no thought ___",
          correctAnswer: ["education", "control"],
          timeLimitSeconds: 30,
          pointsBase: 1,
        },
        {
          questionType: "lyric_blank",
          questionText: "Hello ___, my old ___",
          correctAnswer: ["darkness", "friend"],
          timeLimitSeconds: 30,
          pointsBase: 1,
        },
        {
          questionType: "open_text",
          questionText:
            "Коя песен на The Beatles започва с 'Yesterday, all my troubles seemed so far away'?",
          correctAnswer: "Yesterday",
          acceptableAnswers: ["Yesterday", "Йестърдей"],
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
      ],
    },
    {
      title: "Рунд 3: Мултимедия",
      intro: "Аудио и снимка. 1 точка.",
      questions: [
        {
          questionType: "audio",
          questionText: "Кой изпълнява този откъс?",
          mediaUrl: audioKey,
          correctAnswer: "Michael Jackson",
          acceptableAnswers: ["Michael Jackson", "Майкъл Джексън", "MJ"],
          timeLimitSeconds: 15,
          pointsBase: 1,
        },
        {
          questionType: "image_reveal",
          questionText: "Кой е този артист?",
          mediaUrl: imageKey,
          mediaSource: "Other",
          mediaAttribution: "Seed demo image",
          mediaBlurPx: 24,
          correctAnswer: "Lady Gaga",
          acceptableAnswers: ["Lady Gaga", "Гага", "Stefani Germanotta"],
          timeLimitSeconds: 20,
          pointsBase: 1,
        },
      ],
    },
    {
      title: "Рунд 4: Финал (двойни точки)",
      intro: "3 въпроса, по 2 точки.",
      questions: [
        {
          questionType: "multiple_choice",
          questionText:
            "Кой албум е най-продаваният в историята на музиката?",
          options: ["Thriller", "Bad", "Back in Black", "The Wall"],
          correctAnswer: 0,
          timeLimitSeconds: 20,
          pointsBase: 2,
        },
        {
          questionType: "decade",
          questionText: "През коя година излиза албумът 'Thriller'?",
          correctAnswer: 1982,
          timeLimitSeconds: 20,
          pointsBase: 2,
        },
        {
          questionType: "open_text",
          questionText:
            "Кой композира 'Symphony No. 9' (с темата 'Ode to Joy')?",
          correctAnswer: "Beethoven",
          acceptableAnswers: [
            "Beethoven",
            "Ludwig van Beethoven",
            "Бетовен",
            "Лудвиг ван Бетовен",
          ],
          timeLimitSeconds: 25,
          pointsBase: 2,
        },
      ],
    },
  ];

  // Idempotent without deleting the quiz row (game_sessions FK is
  // RESTRICT): reuse it if present, just refresh its rounds.
  const [existing] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.title, FULL_QUIZ_TITLE))
    .limit(1);

  let quizId: string;
  if (existing) {
    await db
      .update(quizzes)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(quizzes.id, existing.id));
    await db.delete(rounds).where(eq(rounds.quizId, existing.id));
    quizId = existing.id;
  } else {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        creatorId,
        title: FULL_QUIZ_TITLE,
        description:
          "Пълен куиз: 4 рунда, всички 6 типа въпроси, финал с двойни точки.",
        theme: "modern",
        language: "bg",
        status: "published",
        publishedAt: new Date(),
      })
      .returning({ id: quizzes.id });
    if (!inserted) throw new Error("full quiz insert returned no row");
    quizId = inserted.id;
  }

  let totalQuestions = 0;
  for (const [i, def] of roundDefs.entries()) {
    const [r] = await db
      .insert(rounds)
      .values({
        quizId,
        title: def.title,
        orderIndex: i,
        roundType: "standard",
        introSlideText: def.intro,
      })
      .returning({ id: rounds.id });
    if (!r) throw new Error("round insert returned no row");
    await db.insert(questions).values(
      def.questions.map((q, idx) => ({
        ...q,
        roundId: r.id,
        orderIndex: idx,
      }))
    );
    totalQuestions += def.questions.length;
  }

  console.log(
    `  ✓ "${FULL_QUIZ_TITLE}" (${roundDefs.length} rounds, ${totalQuestions} questions, all types)`
  );
}

async function seedDaily() {
  console.log("\nSeeding daily content...");
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000)
    .toISOString()
    .slice(0, 10);

  await db
    .insert(dailyContent)
    .values({
      contentDate: today,
      contentType: "song_of_day",
      payload: {
        title: "Zombie",
        artist: "The Cranberries",
        story:
          "Протестна песен срещу насилието в Северна Ирландия, която по-късно се превръща в спортен химн.",
      },
    })
    .onConflictDoUpdate({
      target: dailyContent.contentDate,
      set: { contentType: "song_of_day" },
    });

  await db
    .insert(dailyContent)
    .values({
      contentDate: tomorrow,
      contentType: "mystery_artist",
      payload: {
        name: "Lady Gaga",
        hints: [
          "Родена 1986 в Ню Йорк",
          "Истинско име: Стефани Джерманота",
          "Хит: Poker Face",
        ],
        story: "Една от най-влиятелните поп артистки на 21 век.",
      },
    })
    .onConflictDoUpdate({
      target: dailyContent.contentDate,
      set: { contentType: "mystery_artist" },
    });

  console.log(`  ✓ song_of_day (${today}), mystery_artist (${tomorrow})`);
}

async function seedBadges() {
  console.log("\nSeeding badges...");
  for (const b of BADGES) {
    await db
      .insert(badges)
      .values({
        slug: b.slug,
        name: b.name,
        description: b.description,
        category: b.category,
        rarity: b.rarity,
        emoji: b.emoji,
        xpReward: b.xp_reward,
      })
      .onConflictDoUpdate({
        target: badges.slug,
        set: {
          name: b.name,
          description: b.description,
          category: b.category,
          rarity: b.rarity,
          emoji: b.emoji,
          xpReward: b.xp_reward,
        },
      });
  }
  // Drop badges no longer in the catalog (e.g. a renamed slug).
  await db.delete(badges).where(
    notInArray(
      badges.slug,
      BADGES.map((b) => b.slug)
    )
  );
  console.log(`  ✓ ${BADGES.length} badges`);

  const [player] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "player@meloman.bg"))
    .limit(1);
  if (!player) return;

  for (const slug of DEMO_AWARDED_BADGES) {
    const [badge] = await db
      .select({ id: badges.id })
      .from(badges)
      .where(eq(badges.slug, slug))
      .limit(1);
    if (!badge) continue;
    await db
      .insert(userBadges)
      .values({ userId: player.id, badgeId: badge.id })
      .onConflictDoNothing();
  }
  console.log(
    `  ✓ awarded ${DEMO_AWARDED_BADGES.length} badges to demo player`
  );
}

// Consistent demo state: the player has streak/XP badges, so give the
// matching progress (7 recent days, rising streak, real XP) instead of
// badges with a 0 XP / empty streak. This is seed data only — the
// runtime XP/streak earning engine is the deferred daily-engagement
// work, not implemented here.
const DEMO_PROGRESS_DAYS = 7;
const DEMO_XP_PER_DAY = 160;

async function seedDemoProgress() {
  console.log("\nSeeding demo player progress...");
  const [player] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "player@meloman.bg"))
    .limit(1);
  if (!player) return;

  for (let i = 0; i < DEMO_PROGRESS_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    await db
      .insert(userProgress)
      .values({
        userId: player.id,
        date,
        dailyXp: DEMO_XP_PER_DAY,
        // Oldest day = streak 1 … today = streak DEMO_PROGRESS_DAYS.
        streakCountAtDay: DEMO_PROGRESS_DAYS - i,
        activities: ["song_of_day"],
      })
      .onConflictDoNothing();
  }
  console.log(
    `  ✓ ${DEMO_PROGRESS_DAYS} days, ${
      DEMO_PROGRESS_DAYS * DEMO_XP_PER_DAY
    } XP, streak ${DEMO_PROGRESS_DAYS}`
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check .env.local at repo root.");
  }

  await seedUsers();
  const adminId = await getSuperAdminId();
  await seedStories(adminId);
  await seedDemoQuiz(adminId);
  await seedDaily();
  await seedBadges();
  await seedDemoProgress();

  console.log(`\nDone. Password for seeded accounts: ${SEED_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
