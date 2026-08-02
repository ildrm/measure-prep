# Measure — IELTS / TOEFL / GRE practice platform

Measure is a complete full-stack timed practice-test platform built with NestJS, Next.js, Prisma, MySQL, Redis, and MinIO. It delivers original IELTS Academic, IELTS General Training, TOEFL iBT, and GRE practice forms through candidate, scoring, analytics, and content-operations workflows.

The product is independent and is not affiliated with or endorsed by the British Council, IDP, Cambridge University Press & Assessment, or ETS.

## Included features

- Email/password registration and sign-in, SMTP-delivered verification/password-reset links, rotating refresh tokens in `httpOnly` cookies, rate limiting, and student/content-editor/admin authorization
- Four published exam tracks, including complete listening, reading, writing, and speaking paths where applicable, plus a short IELTS diagnostic
- Server-authoritative section deadlines, Redis timer mirrors, automatic expiry, reconnect recovery, and debounced idempotent autosave
- Adaptive GRE section routing based on the preceding section score
- Reading split view and highlighting; protected single-play listening; private notes; paste-blocked writing with word counts; timed speaking preparation, recording, and direct media upload; GRE calculator; question flags; and keyboard-friendly navigation
- Informational fullscreen, visibility, and focus-loss integrity logging
- Exact, case-insensitive, lightweight lemmatized, numeric-tolerance, exact multi-select, and partial-credit grading
- Database-backed IELTS band and TOEFL scale lookup, answer-level review, score history, weak-area analysis, section timing, completion funnel, item difficulty/discrimination, and unclear-question reports
- Feature-gated OpenAI-compatible writing/speaking scoring and transcription, with structured validation, retry, persisted prompts/raw results, deterministic prechecks, and manual-review fallback
- Admin content studio for sections, passages, all supported item types and answer keys, adaptive or linear form assembly, protected media upload, bulk JSON import with row-level errors, candidate preview, feature flags, item analytics, audit data, and user roles
- Swagger API documentation at `http://localhost:3001/api/docs`
- Database/Redis/SMTP readiness reporting, TLS termination, production environment validation, and tested database/media backup tooling

## Repository layout

```text
apps/api                 NestJS REST API
apps/web                 Next.js App Router application
packages/shared-types    Shared interfaces and Zod schemas
prisma                   Schema, migrations, and idempotent seed
infra                    Compose services and production nginx override
scripts                   Smoke test, TLS, environment, backup, and restore tools
```

## Run with Docker

Docker Desktop must be running in **Linux containers** mode. From the repository root (`D:\prj\quiz`), create the local environment file once:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

Build every application image, including the one-shot migration and seed images:

```powershell
docker compose --env-file .env -f infra/docker-compose.yml build api web migrate seed
```

Then start the stack:

```powershell
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

The first build downloads dependencies and can take several minutes. Node.js, pnpm, MySQL, Redis, and MinIO do not need to be installed on the host.

Confirm the service state:

```powershell
docker compose --env-file .env -f infra/docker-compose.yml ps -a
```

Expected state:

- `mysql` and `redis`: `Up ... (healthy)`
- `minio`, `mailpit`, `api`, and `web`: `Up`
- `migrate` and `seed`: `Exited (0)`

Open:

- Web application: `http://localhost:3000`
- REST API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- MinIO console: `http://localhost:9001`
- Development email inbox: `http://localhost:8025`
- Readiness check: `http://localhost:3001/api/v1/health/ready`

Run the authenticated smoke test on Windows after the services start:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke.ps1
```

It verifies login, database/Redis/SMTP readiness, actual password-reset email submission, answer autosave, deterministic scoring/review, protected listening media, GRE verbal and quantitative adaptive stages, current TOEFL dual-scale scoring, item reporting/analytics, and feature-flag access.

Follow logs or stop the stack without deleting its volumes:

```powershell
docker compose --env-file .env -f infra/docker-compose.yml logs -f api web
docker compose --env-file .env -f infra/docker-compose.yml down
```

### Rebuild after source changes

Rebuild all application-owned images before restarting:

```powershell
docker compose --env-file .env -f infra/docker-compose.yml build api web migrate seed
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

### Docker troubleshooting

- If Docker reports an error for `dockerDesktopLinuxEngine`, restart Docker Desktop and retry. The CLI command is `docker desktop restart`.
- If ports `3000`, `3001`, `3306`, `6379`, `9000`, or `9001` are already in use, stop the conflicting local service or change the published ports in the Compose file.
- If setup fails, inspect `docker compose --env-file .env -f infra/docker-compose.yml logs migrate seed`.
- If the API or web container exits, inspect `docker compose --env-file .env -f infra/docker-compose.yml logs api web`.

## Demo accounts

Both seeded accounts use password `Practice123!`:

- Student: `student@exam.local`
- Administrator: `admin@exam.local`

The seed is idempotent and publishes IELTS Academic, IELTS General Training, TOEFL, and adaptively routed GRE forms. It also creates protected listening assets, scoring tables, and disabled-by-default AI feature flags.

## Local development

Run MySQL, Redis, and MinIO, or point `.env` at available instances, then run:

```powershell
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Useful verification commands:

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
docker compose --env-file .env -f infra/docker-compose.yml config --quiet
```

## Operational behavior

The database deadline is authoritative. Redis mirrors the active timer for fast reads, while the API checks persisted deadlines during reads and writes and runs an expiry sweep even when a candidate disconnects. Pending browser saves are flushed before manual section submission.

Published forms with attempts are immutable through the API; create a new version to change them. Answer keys, correct-option markers, and listening transcripts are removed from active-session payloads and returned only after submission. Media reads and speaking uploads require an authenticated session that owns the associated attempt.

AI scoring requires both environment configuration and the applicable global or exam-level feature flag. Configure `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL`, set `AI_SCORING_ENABLED=true`, then enable `AI_SCORING` in the admin studio. Speaking transcription additionally requires `STT_BASE_URL`, `STT_API_KEY`, and `STT_MODEL`, plus the `TRANSCRIPTION` flag. If a provider is disabled or fails validation, the attempt moves to `MANUAL_REVIEW`; AI results are always labeled as practice estimates.

## Exam-format baseline

The bundled forms were checked on August 2, 2026 against the official [IELTS Academic format and timing](https://ielts.org/take-a-test/test-types/ielts-academic-test), [IELTS scoring guidance](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail), [current TOEFL content and timing](https://www.ets.org/toefl/test-takers/ibt/about/content.html.html), [TOEFL 1–6 score comparison](https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html), and [GRE structure and timing](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html).

TOEFL practice scores use the current 1–6 half-band scale and retain a comparable 0–30 value for objective Reading/Listening review. GRE Verbal and Quantitative practice scores use 130–170 form-specific linear lookup tables; official ETS equating is proprietary, so every result remains explicitly labeled as a practice estimate.

## Production deployment

Generate a git-ignored production environment file with random database, JWT, and storage secrets. SMTP parameters are required so account recovery remains functional:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/new-production-env.ps1 `
  -Domain practice.example.com `
  -SmtpHost smtp.example.com `
  -SmtpUser smtp-user `
  -SmtpPassword 'provider-password' `
  -EmailFrom 'Measure <no-reply@example.com>'
```

Install trusted certificate files as `infra/nginx/certs/fullchain.pem` and `infra/nginx/certs/privkey.pem`. For a local TLS check only, generate a 30-day self-signed certificate:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-dev-certs.ps1
```

Deploy with the production environment and TLS override:

```powershell
docker compose --env-file .env.production -f infra/docker-compose.yml -f infra/docker-compose.prod.yml build api web migrate seed
docker compose --env-file .env.production -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d
```

The API refuses to start in production when example credentials, short JWT secrets, non-HTTPS public URLs, or missing SMTP configuration are detected.

### Backup and restore

Create a timestamped MySQL and MinIO backup under the git-ignored `backups` directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup.ps1
```

Restore a selected backup only after checking that it targets the intended stack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore.ps1 `
  -BackupDirectory .\backups\YYYYMMDD-HHMMSS `
  -ConfirmRestore
docker compose --env-file .env -f infra/docker-compose.yml restart api web
```

For any newly authored or materially changed exam form, verify current official timing/conversion guidance and calibrate optional AI scoring against qualified human raters before enabling its feature flags.
