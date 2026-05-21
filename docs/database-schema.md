# Database Schema

Postgres (Neon, EU) via Drizzle ORM. Every table has a `uuid` PK
(`defaultRandom()`); timestamps are `timestamptz`. Enums are Postgres
`pgEnum`. Migrations live in `packages/db/migrations/`.

## ER diagram (implemented tables)

```mermaid
erDiagram
    users ||--o{ quizzes : creates
    users ||--o{ game_sessions : hosts
    quizzes ||--o{ rounds : has
    quizzes ||--o{ game_sessions : "played as"
    quizzes }o--o| sponsors : "sponsored by"
    quizzes ||--o{ quiz_sponsors : "many-to-many"
    sponsors ||--o{ quiz_sponsors : "many-to-many"
    rounds ||--o{ questions : has
    game_sessions ||--o{ teams : has
    game_sessions }o--o| questions : "current question"
    teams ||--o{ team_members : has
    teams ||--o{ answers : submits
    questions ||--o{ answers : "answered by"
    users ||--o{ team_members : "is"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar display_name
        enum role "player|admin|super_admin"
        boolean email_verified
        timestamptz created_at
    }
    quizzes {
        uuid id PK
        uuid creator_id FK
        varchar title
        enum theme "modern|vintage|neon"
        enum language "bg|en"
        enum status "draft|published|archived"
        int max_team_size
        uuid sponsor_id FK
        timestamptz deleted_at
    }
    rounds {
        uuid id PK
        uuid quiz_id FK
        varchar title
        int order_index
        enum round_type "standard|mystery_artist|final"
        int advancement_top_n
    }
    questions {
        uuid id PK
        uuid round_id FK
        int order_index
        enum question_type "multiple_choice|open_text|audio|image_reveal|lyric_blank|decade"
        text question_text
        text media_url
        int media_blur_px
        jsonb correct_answer
        jsonb acceptable_answers
        int time_limit_seconds
        int points_base
    }
    game_sessions {
        uuid id PK
        uuid quiz_id FK
        uuid host_id FK
        varchar join_code UK
        enum status "lobby|active|reveal|between_rounds|paused|finished"
        uuid current_question_id FK
        timestamptz question_started_at
        timestamptz question_ends_at
        timestamptz paused_at
        boolean public_event
        varchar venue
        timestamptz scheduled_start_at
        timestamptz scheduled_end_at
    }
    teams {
        uuid id PK
        uuid session_id FK
        varchar name
        uuid captain_user_id FK
        int total_score
        boolean is_active
    }
    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        varchar device_fingerprint
    }
    answers {
        uuid id PK
        uuid team_id FK
        uuid question_id FK
        jsonb submitted_answer
        boolean is_correct
        boolean host_override
        int points_awarded
    }
    sponsors {
        uuid id PK
        varchar name
        text logo_r2_key
    }
    quiz_sponsors {
        uuid quiz_id FK
        uuid sponsor_id FK
    }
```

Anti-cheat: `UNIQUE(team_id, device_fingerprint)` on `team_members`;
`UNIQUE(team_id, question_id)` on `answers` (one answer per team per
question).

## Editorial & engagement tables (migrations 0009–0010)

Shipped — 15 tables total.

```mermaid
erDiagram
    users ||--o{ stories : authors
    users ||--o{ user_progress : tracks
    users ||--o{ user_badges : earns
    badges ||--o{ user_badges : awarded
    stories {
        uuid id PK
        uuid author_id FK
        varchar slug UK
        text title
        text body "TipTap/HTML"
        varchar artist_name
        int view_count
        timestamptz published_at "null = draft"
    }
    daily_content {
        uuid id PK
        date content_date UK
        enum content_type "song_of_day|mystery_artist"
        jsonb payload
    }
    user_progress {
        uuid user_id FK
        date date
        int daily_xp
        int streak_count_at_day
    }
    badges {
        uuid id PK
        varchar slug UK
        text name
        jsonb criteria
    }
    user_badges {
        uuid user_id FK
        uuid badge_id FK
        timestamptz earned_at
    }
```

`user_progress` PK is `(user_id, date)`; `user_badges` PK is
`(user_id, badge_id)`. `users.banned_at` (migration 0010) gates the user
management panel.
