// packages/db/seed-badges.ts
// Catalog of record for all badges (owner-authored). Seeded into the
// `badges` table by seed.ts. Icons (slug -> Lucide component) live in
// packages/shared/badges-icons.ts and are keyed by the same slug.
export const BADGES = [
  // ═══════════════════════════════════════
  // 🔥 STREAK
  // ═══════════════════════════════════════
  { slug: 'meloman-novice',      emoji: '🔥', name: 'Меломан Novice',     description: '3 поредни дни',                                category: 'streak', rarity: 'common',    xp_reward: 50 },
  { slug: 'meloman-apprentice',  emoji: '🔥', name: 'Меломан Apprentice', description: '7 поредни дни',                                category: 'streak', rarity: 'common',    xp_reward: 100 },
  { slug: 'consistent',          emoji: '🌶️', name: 'Постоянен',           description: '14 поредни дни',                               category: 'streak', rarity: 'rare',      xp_reward: 200 },
  { slug: 'vinyl-veteran',       emoji: '💿', name: 'Vinyl Veteran',       description: '30 поредни дни',                               category: 'streak', rarity: 'rare',      xp_reward: 500 },
  { slug: 'lifer',               emoji: '🏆', name: 'Lifer',               description: '100 поредни дни',                              category: 'streak', rarity: 'epic',      xp_reward: 1500 },
  { slug: 'legend',              emoji: '👑', name: 'Легенда',             description: '365 поредни дни',                              category: 'streak', rarity: 'legendary', xp_reward: 5000 },
  { slug: 'cold-save',           emoji: '❄️', name: 'Cold Save',           description: 'Използвай първия Streak Freeze',               category: 'streak', rarity: 'common',    xp_reward: 25 },

  // ═══════════════════════════════════════
  // 🎯 DAILY MASTERY
  // ═══════════════════════════════════════
  { slug: 'morning-bird',        emoji: '🌅', name: 'Утринна птица',       description: 'Изиграй Song of Day преди 10:00 — 5 пъти',     category: 'daily',  rarity: 'common',    xp_reward: 100 },
  { slug: 'night-owl',           emoji: '🦉', name: 'Нощна птица',         description: 'Изиграй Song of Day след 22:00 — 5 пъти',      category: 'daily',  rarity: 'common',    xp_reward: 100 },
  { slug: 'listener',            emoji: '🎧', name: 'Слушател',            description: 'Изиграй 30 Song of Day',                       category: 'daily',  rarity: 'rare',      xp_reward: 200 },
  { slug: 'meloman-master',      emoji: '🎼', name: 'Меломан',             description: 'Изиграй 100 Song of Day',                      category: 'daily',  rarity: 'epic',      xp_reward: 600 },
  { slug: 'first-guess',         emoji: '🧠', name: 'Първи опит',          description: 'Познай Mystery Artist на 1-ва фаза — 5 пъти',  category: 'daily',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'quick-mind',          emoji: '💡', name: 'Бърз ум',             description: 'Познай Song of Day за под 5 секунди — 10 пъти', category: 'daily', rarity: 'rare',      xp_reward: 250 },
  { slug: 'perfect-week',        emoji: '✨', name: 'Perfect Week',        description: '7 поредни Song of Day с правилен отговор',     category: 'daily',  rarity: 'epic',      xp_reward: 400 },

  // ═══════════════════════════════════════
  // 🎤 LIVE QUIZ
  // ═══════════════════════════════════════
  { slug: 'first-concert',       emoji: '🎫', name: 'Първи концерт',       description: 'Първи live quiz',                              category: 'live',   rarity: 'common',    xp_reward: 100 },
  { slug: 'regular',             emoji: '🍻', name: 'Завсегдатай',         description: '5 различни live quiz-а',                       category: 'live',   rarity: 'rare',      xp_reward: 250 },
  { slug: 'bronze',              emoji: '🥉', name: 'Бронз',               description: 'Top 3 в live quiz',                            category: 'live',   rarity: 'common',    xp_reward: 300 },
  { slug: 'silver',              emoji: '🥈', name: 'Сребро',              description: 'Top 2 в live quiz',                            category: 'live',   rarity: 'rare',      xp_reward: 500 },
  { slug: 'champion',            emoji: '🥇', name: 'Шампион',             description: 'Победа в live quiz',                           category: 'live',   rarity: 'epic',      xp_reward: 1000 },
  { slug: 'snap-submit',         emoji: '⚡', name: 'Skopelin',           description: 'Submit под 3 секунди — 10 пъти',               category: 'live',   rarity: 'rare',      xp_reward: 200 },
  { slug: 'captain',             emoji: '🫡', name: 'Капитан',             description: 'Бъди captain в 5 различни quiz-а',             category: 'live',   rarity: 'rare',      xp_reward: 300 },
  { slug: 'vidin-champion',      emoji: '📍', name: 'Vidin Champion',      description: 'Top 3 на live event във Видин',                category: 'live',   rarity: 'epic',      xp_reward: 500 },
  { slug: 'tour',                emoji: '🌍', name: 'Tour',                description: 'Играй в 3 различни локации',                   category: 'live',   rarity: 'rare',      xp_reward: 400 },
  { slug: 'perfect-game',        emoji: '💯', name: 'Perfect Game',        description: 'Перфектен резултат на quiz',                   category: 'live',   rarity: 'legendary', xp_reward: 1500 },

  // ═══════════════════════════════════════
  // 🎸 GENRE KNOWLEDGE
  // ═══════════════════════════════════════
  { slug: 'rock-encyclopedia',   emoji: '🎸', name: 'Rock Encyclopedia',   description: '20 правилни rock въпроса',                     category: 'genre',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'pop-star',            emoji: '🎤', name: 'Pop Star',            description: '20 правилни pop въпроса',                      category: 'genre',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'classic',             emoji: '🎹', name: 'Класик',              description: '20 правилни класически въпроса',                category: 'genre',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'metal-head',          emoji: '🤘', name: 'Metal Head',          description: '20 правилни metal въпроса',                    category: 'genre',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'jazz-cat',            emoji: '🎺', name: 'Jazz Cat',            description: '20 правилни jazz въпроса',                     category: 'genre',  rarity: 'rare',      xp_reward: 300 },
  { slug: 'bulgarian',           emoji: '🪕', name: 'Балканец',            description: '20 правилни български въпроса',                category: 'genre',  rarity: 'rare',      xp_reward: 400 },
  { slug: 'globetrotter',        emoji: '🗺️', name: 'Globetrotter',        description: 'Правилни въпроси от 10 различни националности', category: 'genre', rarity: 'epic',      xp_reward: 500 },
  { slug: 'retro-soul',          emoji: '📻', name: 'Retro Soul',          description: '20 правилни въпроса от 60s/70s',                category: 'genre', rarity: 'rare',      xp_reward: 400 },
  { slug: '80s-kid',             emoji: '📼', name: '80s Kid',             description: '20 правилни въпроса от 80s',                    category: 'genre', rarity: 'rare',      xp_reward: 400 },
  { slug: '90s-nostalgia',       emoji: '💽', name: '90s Nostalgia',       description: '20 правилни въпроса от 90s',                    category: 'genre', rarity: 'rare',      xp_reward: 400 },

  // ═══════════════════════════════════════
  // 📚 READER / EXPLORER
  // ═══════════════════════════════════════
  { slug: 'curious',             emoji: '📖', name: 'Любопитен',           description: 'Прочети първа история',                        category: 'reader', rarity: 'common',    xp_reward: 50 },
  { slug: 'bookworm',            emoji: '📚', name: 'Bookworm',            description: 'Прочети 10 истории',                           category: 'reader', rarity: 'rare',      xp_reward: 250 },
  { slug: 'scholar',             emoji: '🎓', name: 'Учен',                description: 'Прочети 50 истории',                           category: 'reader', rarity: 'epic',      xp_reward: 1000 },
  { slug: 'explorer',            emoji: '🔎', name: 'Изследовател',        description: 'Прочети истории от 5 различни декадеи',         category: 'reader', rarity: 'rare',      xp_reward: 400 },
  { slug: 'deep-read',           emoji: '⏱️', name: 'Дълбоко четене',      description: 'Прекарай 1 час в stories секцията',            category: 'reader', rarity: 'rare',      xp_reward: 200 },

  // ═══════════════════════════════════════
  // 🎲 SPECIAL / RARE
  // ═══════════════════════════════════════
  { slug: 'first-steps',         emoji: '🥚', name: 'Първи стъпки',        description: 'Регистрирай се',                               category: 'special', rarity: 'common',    xp_reward: 25 },
  { slug: 'welcome-pack',        emoji: '🎁', name: 'Welcome Pack',        description: 'Завърши tutorial',                             category: 'special', rarity: 'common',    xp_reward: 100 },
  { slug: 'lucky',               emoji: '🦄', name: 'Лъки',                description: 'Познай Mystery Artist 100% при дума без подсказка', category: 'special', rarity: 'legendary', xp_reward: 500 },
  { slug: 'sniper',              emoji: '🎯', name: 'Снайпер',             description: '10 правилни open-text отговора без typo',      category: 'special', rarity: 'epic',      xp_reward: 300 },
  { slug: 'champion-week',       emoji: '🌟', name: 'Champion Week',       description: 'Влез в Top 3 на weekly leaderboard',            category: 'special', rarity: 'epic',      xp_reward: 750 },
  { slug: 'founders',            emoji: '🏛️', name: 'Founders',            description: 'Премиум beta tester (първите 50 потребители)', category: 'special', rarity: 'legendary', xp_reward: 1000 },
  { slug: 'birthday',            emoji: '🎂', name: 'Birthday',            description: 'Влез на рождения си ден',                      category: 'special', rarity: 'rare',      xp_reward: 200 },
  { slug: 'bulgarian-pro',       emoji: '🇧🇬', name: 'Българофил',          description: '50 правилни въпроса за БГ музика',             category: 'special', rarity: 'epic',      xp_reward: 800 },

  // ═══════════════════════════════════════
  // 🤝 SOCIAL
  // ═══════════════════════════════════════
  { slug: 'social',              emoji: '👥', name: 'Социален',            description: 'Покани приятел да играе',                      category: 'social', rarity: 'common',    xp_reward: 100 },
  { slug: 'promoter',            emoji: '🎉', name: 'Promoter',            description: '5 поканени приятели',                          category: 'social', rarity: 'epic',      xp_reward: 500 },
  { slug: 'share',               emoji: '📸', name: 'Share',               description: 'Сподели Wrapped карта',                        category: 'social', rarity: 'common',    xp_reward: 50 },
  { slug: 'team-player',         emoji: '💬', name: 'Team Player',         description: 'Играй в 3 различни отбора',                    category: 'social', rarity: 'rare',      xp_reward: 200 },

  // ═══════════════════════════════════════
  // 💪 TOTAL POWER (collection)
  // ═══════════════════════════════════════
  { slug: 'xp-1k',               emoji: '⭐', name: 'XP 1K',               description: '1000 XP общо',                                  category: 'total', rarity: 'common',    xp_reward: 100 },
  { slug: 'xp-5k',               emoji: '🌟', name: 'XP 5K',               description: '5000 XP общо',                                  category: 'total', rarity: 'rare',      xp_reward: 500 },
  { slug: 'xp-10k',              emoji: '💫', name: 'XP 10K',              description: '10000 XP общо',                                 category: 'total', rarity: 'epic',      xp_reward: 1000 },
  { slug: 'semi-collector',      emoji: '🏅', name: 'Полу-колекционер',    description: 'Спечели 25 значки',                            category: 'total', rarity: 'epic',      xp_reward: 500 },
  { slug: 'collector',           emoji: '🎖️', name: 'Колекционер',         description: 'Спечели 50 значки',                            category: 'total', rarity: 'legendary', xp_reward: 1500 },
  { slug: 'immortal',            emoji: '👑', name: 'Безсмъртен',          description: 'Всички значки',                                category: 'total', rarity: 'legendary', xp_reward: 5000 },
] as const;
