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

## Planned (Phase 2)

`stories`, `daily_content`, `user_progress`, `badges`, `user_badges` —
added with migrations when the Stories/Daily features land. This document
is updated then (per CLAUDE.md §8.10: keep docs honest).
