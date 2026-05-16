import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./client";
import {
  badges,
  dailyContent,
  questions,
  quizzes,
  rounds,
  stories,
  userBadges,
  users,
} from "./schema";
import { uploadToR2 } from "./r2-seed";

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

// Badge catalog. Icons + rarity live in packages/shared/badges-icons.ts
// (slug is the single source of truth shared with the UI). Criteria is the
// auto-detection rule for a future awarding engine — informational for now.
const SEED_BADGES: {
  slug: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
}[] = [
  // STREAK
  { slug: "meloman-novice", name: "Меломан Novice", description: "7 поредни дни активност", criteria: { type: "streak", days: 7 } },
  { slug: "meloman-apprentice", name: "Меломан Чирак", description: "14 поредни дни активност", criteria: { type: "streak", days: 14 } },
  { slug: "consistent", name: "Постоянство", description: "21 поредни дни активност", criteria: { type: "streak", days: 21 } },
  { slug: "vinyl-veteran", name: "Винил Ветеран", description: "30 поредни дни активност", criteria: { type: "streak", days: 30 } },
  { slug: "lifer", name: "Меломан за цял живот", description: "100 поредни дни активност", criteria: { type: "streak", days: 100 } },
  { slug: "legend", name: "Легенда", description: "365 поредни дни активност", criteria: { type: "streak", days: 365 } },
  { slug: "cold-save", name: "Спасен с лед", description: "Използвай Streak Freeze", criteria: { type: "streak_freeze", count: 1 } },
  // DAILY
  { slug: "morning-bird", name: "Ранно пиле", description: "Реши Песен на деня преди 9:00", criteria: { type: "daily_time", before: "09:00" } },
  { slug: "night-owl", name: "Нощна птица", description: "Реши Песен на деня след 22:00", criteria: { type: "daily_time", after: "22:00" } },
  { slug: "listener", name: "Слушател", description: "Чуй 10 Песни на деня", criteria: { type: "daily_count", songs: 10 } },
  { slug: "meloman", name: "Истински меломан", description: "50 дни с дневно съдържание", criteria: { type: "daily_count", days: 50 } },
  { slug: "first-guess", name: "От раз", description: "Познай Песен на деня от първи опит", criteria: { type: "first_try" } },
  { slug: "quick-mind", name: "Бърз ум", description: "Познай за под 10 секунди", criteria: { type: "daily_speed", seconds: 10 } },
  { slug: "perfect-week", name: "Перфектна седмица", description: "7 верни поредни дни", criteria: { type: "daily_perfect", days: 7 } },
  // LIVE QUIZ
  { slug: "first-concert", name: "Първи концерт", description: "Изиграй първия си куиз на живо", criteria: { type: "quiz_played", count: 1 } },
  { slug: "regular", name: "Редовен", description: "Изиграй 10 куиза на живо", criteria: { type: "quiz_played", count: 10 } },
  { slug: "bronze", name: "Бронз", description: "Завърши 3-ти на куиз", criteria: { type: "quiz_place", place: 3 } },
  { slug: "silver", name: "Сребро", description: "Завърши 2-ри на куиз", criteria: { type: "quiz_place", place: 2 } },
  { slug: "champion", name: "Шампион", description: "Спечели куиз на живо", criteria: { type: "quiz_place", place: 1 } },
  { slug: "snap-submit", name: "Светкавица", description: "Верен отговор за под 3 секунди", criteria: { type: "answer_speed", seconds: 3 } },
  { slug: "captain", name: "Капитан", description: "Бъди капитан на отбор", criteria: { type: "captain" } },
  { slug: "vidin-champion", name: "Шампион на Видин", description: "Топ 3 на събитие във Видин", criteria: { type: "local", city: "Vidin", place: 3 } },
  { slug: "tour", name: "Турне", description: "Играй на 3 различни събития", criteria: { type: "events", count: 3 } },
  { slug: "perfect-game", name: "Перфектна игра", description: "Всички въпроси верни в куиз", criteria: { type: "quiz_perfect" } },
  // GENRES
  { slug: "rock-encyclopedia", name: "Рок енциклопедия", description: "20 верни рок въпроса", criteria: { type: "genre", genre: "rock", correct: 20 } },
  { slug: "pop-star", name: "Поп звезда", description: "20 верни поп въпроса", criteria: { type: "genre", genre: "pop", correct: 20 } },
  { slug: "classic", name: "Класика", description: "20 верни класически въпроса", criteria: { type: "genre", genre: "classical", correct: 20 } },
  { slug: "metal-head", name: "Метъл глава", description: "20 верни метъл въпроса", criteria: { type: "genre", genre: "metal", correct: 20 } },
  { slug: "jazz-cat", name: "Джаз котка", description: "20 верни джаз въпроса", criteria: { type: "genre", genre: "jazz", correct: 20 } },
  { slug: "bulgarian", name: "Българска вълна", description: "30 верни български въпроса", criteria: { type: "genre", genre: "bg", correct: 30 } },
  { slug: "globetrotter", name: "Световен пътешественик", description: "Верни въпроси от 5 държави", criteria: { type: "countries", count: 5 } },
  { slug: "retro-soul", name: "Ретро душа", description: "20 верни соул/фънк въпроса", criteria: { type: "genre", genre: "soul", correct: 20 } },
  { slug: "80s-kid", name: "Дете на 80-те", description: "20 верни въпроса от 80-те", criteria: { type: "decade", decade: 1980, correct: 20 } },
  { slug: "90s-nostalgia", name: "90-те носталгия", description: "20 верни въпроса от 90-те", criteria: { type: "decade", decade: 1990, correct: 20 } },
  // READER
  { slug: "curious", name: "Любопитен", description: "Прочети първата си история", criteria: { type: "stories_read", count: 1 } },
  { slug: "bookworm", name: "Книжен плъх", description: "Прочети 10 истории", criteria: { type: "stories_read", count: 10 } },
  { slug: "scholar", name: "Учен", description: "Прочети 30 истории", criteria: { type: "stories_read", count: 30 } },
  { slug: "explorer", name: "Изследовател", description: "Разгледай 5 артист страници", criteria: { type: "artists_viewed", count: 5 } },
  { slug: "deep-read", name: "Задълбочен", description: "Прочети история до края", criteria: { type: "story_complete" } },
  // SPECIAL
  { slug: "first-steps", name: "Първи стъпки", description: "Завърши регистрацията си", criteria: { type: "onboarding" } },
  { slug: "welcome-pack", name: "Добре дошъл", description: "Първи ден в Меломан", criteria: { type: "first_day" } },
  { slug: "lucky", name: "Късметлия", description: "Познай само с едно налучкване", criteria: { type: "lucky_guess" } },
  { slug: "sniper", name: "Снайперист", description: "10 поредни верни отговора", criteria: { type: "streak_correct", count: 10 } },
  { slug: "champion-week", name: "Седмичен шампион", description: "Топ 3 в седмичната класация", criteria: { type: "weekly_leaderboard", place: 3 } },
  { slug: "founders", name: "Основатели", description: "Един от първите 100 потребители", criteria: { type: "early_user", max: 100 } },
  { slug: "birthday", name: "Рожден ден", description: "Влез на рождения си ден", criteria: { type: "birthday" } },
  { slug: "bulgarian-pro", name: "Българска класа", description: "100 верни български въпроса", criteria: { type: "genre", genre: "bg", correct: 100 } },
  // SOCIAL
  { slug: "social", name: "Социален", description: "Покани приятел", criteria: { type: "invite", count: 1 } },
  { slug: "promoter", name: "Промоутър", description: "Покани 5 приятели", criteria: { type: "invite", count: 5 } },
  { slug: "share", name: "Споделил", description: "Сподели Wrapped карта", criteria: { type: "share" } },
  { slug: "team-player", name: "Отборен играч", description: "Играй в 5 различни отбора", criteria: { type: "teams", count: 5 } },
  // TOTAL XP
  { slug: "xp-1k", name: "1 000 точки", description: "Събери 1 000 XP", criteria: { type: "xp", amount: 1000 } },
  { slug: "xp-5k", name: "5 000 точки", description: "Събери 5 000 XP", criteria: { type: "xp", amount: 5000 } },
  { slug: "xp-10k", name: "10 000 точки", description: "Събери 10 000 XP", criteria: { type: "xp", amount: 10000 } },
  { slug: "semi-collector", name: "Полу-колекционер", description: "Отключи 15 значки", criteria: { type: "badges", count: 15 } },
  { slug: "collector", name: "Колекционер", description: "Отключи 30 значки", criteria: { type: "badges", count: 30 } },
  { slug: "immortal", name: "Безсмъртен", description: "Отключи всички значки", criteria: { type: "badges", all: true } },
];

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
  for (const b of SEED_BADGES) {
    await db
      .insert(badges)
      .values({
        slug: b.slug,
        name: b.name,
        description: b.description,
        criteria: b.criteria,
      })
      .onConflictDoUpdate({
        target: badges.slug,
        set: {
          name: b.name,
          description: b.description,
          criteria: b.criteria,
        },
      });
  }
  console.log(`  ✓ ${SEED_BADGES.length} badges`);

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

  console.log(`\nDone. Password for seeded accounts: ${SEED_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
