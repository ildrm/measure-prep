# MeasurePrep — IELTS, TOEFL iBT & GRE Practice and Assessment Platform

**MeasurePrep** is a full-stack exam preparation, practice testing, scoring, and analytics platform for **IELTS Academic**, **IELTS General Training**, **TOEFL iBT**, and **GRE**.

Built with **Next.js, NestJS, TypeScript, Prisma, MySQL, Redis, MinIO, and Docker**, MeasurePrep provides timed mock exams, adaptive GRE testing, automated scoring, AI-assisted writing and speaking evaluation, detailed performance analytics, secure media delivery, and comprehensive exam-content management.

It is designed for developers, educators, language schools, test-preparation providers, assessment platforms, and organizations that need a modern **computer-based testing and online examination system**.

> MeasurePrep is an independent practice platform and is not affiliated with, sponsored by, or endorsed by the British Council, IDP, Cambridge University Press & Assessment, or ETS.

---

## Features

MeasurePrep combines the candidate testing experience, scoring engine, analytics system, content management tools, and operational infrastructure required to run a complete online exam-practice platform.

### IELTS Practice Tests

Support for:

- IELTS Academic
- IELTS General Training
- IELTS diagnostic tests
- Reading
- Listening
- Writing
- Speaking
- IELTS band-score lookup
- Section-level performance analysis
- Answer review
- Weak-area identification
- Timed exam simulation

The platform supports realistic computer-based IELTS practice workflows including reading passages, listening media, writing tasks, speaking preparation, recording, and post-exam analysis.

### TOEFL iBT Practice

TOEFL practice workflows include:

- Reading
- Listening
- Writing
- Speaking
- Timed section execution
- Automated objective scoring
- Writing and speaking evaluation workflows
- Score history
- Answer-level review
- Performance analytics
- Configurable scoring tables

The scoring architecture supports database-backed score conversion rather than embedding scoring rules directly into application code.

### GRE Practice Tests

MeasurePrep supports both:

- GRE Verbal Reasoning
- GRE Quantitative Reasoning

GRE capabilities include:

- Adaptive section routing
- Difficulty-based progression
- Quantitative calculator
- Numeric-entry questions
- Quantitative comparison
- Multiple-choice questions
- Multi-select questions
- Timed sections
- Question flagging
- Score conversion
- Section analytics

Adaptive GRE routing can select a subsequent section based on the candidate's performance in the preceding section.

---

## Online Exam Simulator

MeasurePrep provides a server-controlled testing environment designed for realistic timed practice.

Core exam-session capabilities include:

- Server-authoritative exam timers
- Redis-backed timer mirrors
- Automatic section expiration
- Automatic submission
- Reconnect recovery
- Debounced autosave
- Idempotent answer persistence
- Question navigation
- Question flagging
- Keyboard-friendly controls
- Private candidate notes
- Reading highlighting
- Section breaks
- Attempt recovery
- Submission protection

The database remains the authoritative source for section deadlines. Redis is used as a fast-access timer mirror rather than the source of truth.

This prevents browser-side timer manipulation from controlling the actual exam deadline.

---

## Computer-Based Reading Experience

Reading sections provide a dedicated examination interface with features such as:

- Split-screen passage and question layout
- Passage highlighting
- Question navigation
- Saved answers
- Private notes
- Question flags
- Automatic progress persistence
- Timed section handling

These capabilities are designed to reproduce the interaction patterns expected from modern computer-delivered standardized examinations.

---

## Listening Practice

Listening sections support protected audio delivery and controlled playback.

Capabilities include:

- Authenticated media access
- Protected audio assets
- Single-play listening workflows
- Timed listening sections
- Answer autosave
- Automatic section expiration
- Candidate-specific authorization
- Secure media ownership checks

Listening transcripts and answer-key information are excluded from active exam-session responses.

---

## Writing Practice

Writing tasks include:

- Timed writing sessions
- Live word count
- Paste blocking
- Autosave
- Deterministic validation
- Manual grading support
- AI-assisted scoring
- Structured scoring results
- Retry handling
- Manual-review fallback
- Persisted evaluation results

AI evaluation is optional and controlled through feature flags and environment configuration.

The application remains usable when AI scoring is unavailable.

---

## Speaking Practice

Speaking workflows support:

- Preparation timers
- Response timers
- Browser recording
- Direct media upload
- Protected recording storage
- Candidate-specific access control
- Speech-to-text integration
- AI-assisted evaluation
- Manual-review fallback

Recorded speaking responses can be stored through the S3-compatible media layer provided by MinIO.

---

## Adaptive Testing

MeasurePrep includes support for adaptive assessment workflows.

The bundled GRE implementation can route candidates to different subsequent sections according to their performance in the preceding section.

The architecture separates:

- Test forms
- Sections
- Difficulty levels
- Candidate attempts
- Scoring
- Adaptive routing

This allows additional adaptive testing strategies to be implemented without redesigning the entire examination engine.

---

## Automated Scoring Engine

MeasurePrep supports multiple grading strategies.

Available matching and grading approaches include:

- Exact matching
- Case-insensitive matching
- Lightweight lemmatized matching
- Numeric tolerance
- Exact multi-select scoring
- Partial-credit multi-select scoring
- Manual scoring
- AI-assisted scoring

Different question types can therefore use scoring logic appropriate to their structure.

---

## AI-Assisted Exam Scoring

Optional AI functionality can assist with subjective responses such as writing and speaking.

The AI scoring architecture includes:

- OpenAI-compatible LLM endpoints
- Configurable model providers
- Structured output validation
- Deterministic prechecks
- Prompt persistence
- Raw-result persistence
- Retry handling
- Feature flags
- Global enable/disable controls
- Exam-level controls
- Manual-review fallback
- Failure handling

AI-generated results should be treated as **practice estimates**, not official exam scores.

AI scoring remains disabled unless both the required environment configuration and the corresponding application feature flags are enabled.

---

## Speech-to-Text

Speaking responses can optionally pass through a configurable speech-to-text provider.

Configuration supports:

```env
STT_BASE_URL=
STT_API_KEY=
STT_MODEL=
```

Transcription functionality must additionally be enabled through the relevant feature flag.

If transcription or AI scoring is unavailable, the platform can route the response to manual review.

---

## Exam Analytics

MeasurePrep includes analytics for both candidates and content administrators.

### Candidate Analytics

Candidates can review:

- Score history
- Section scores
- Answer-level results
- Weak areas
- Skill performance
- Section timing
- Completion history
- Practice progress

### Assessment Analytics

Content administrators can analyze:

- Item difficulty
- Item discrimination
- Completion funnels
- Section timing
- Question performance
- Candidate reports
- Unclear-question reports
- Form performance

These analytics help identify both candidate weaknesses and problems in assessment content.

---

## Question Types

The assessment engine supports multiple question formats, including:

- Single choice
- Multiple select
- True / False / Not Given
- Matching
- Gap fill
- Numeric entry
- Quantitative comparison
- Essay
- Speaking task

The architecture allows additional question types and grading strategies to be introduced later.

---

## Content Management Studio

MeasurePrep contains administrative tools for building and managing exam content.

Content editors and administrators can work with:

- Exams
- Sections
- Reading passages
- Questions
- Answer choices
- Answer keys
- Question types
- Scoring strategies
- Audio assets
- Test forms
- Linear forms
- Adaptive forms
- Difficulty levels
- Candidate previews
- Feature flags
- Analytics
- User roles
- Audit information

Bulk JSON import is also supported.

Import validation can report errors at individual-row level instead of failing the complete import without context.

---

## Test Form Versioning

Published forms that already have candidate attempts are treated as immutable.

Instead of modifying historical assessments, administrators create new versions.

This protects:

- Score reproducibility
- Historical analytics
- Candidate results
- Auditability
- Assessment consistency

---

## Authentication and Authorization

The platform includes a complete account and authorization system.

Supported functionality includes:

- Email/password registration
- Login
- Email verification
- Password recovery
- SMTP email delivery
- Refresh-token rotation
- `httpOnly` authentication cookies
- Rate limiting
- Role-based authorization

Available roles include:

```text
STUDENT
CONTENT_EDITOR
ADMIN
```

---

## Security

MeasurePrep includes multiple security controls relevant to online assessment systems.

These include:

- Server-authoritative exam deadlines
- Role-based authorization
- Authenticated media access
- Attempt ownership validation
- Hidden answer keys during active attempts
- Protected listening transcripts
- Protected correct-answer markers
- HTTP-only refresh-token cookies
- Refresh-token rotation
- Rate limiting
- Production secret validation
- HTTPS validation
- SMTP configuration validation
- Audit data
- Controlled media uploads

The production API rejects several unsafe deployment configurations, including insecure public URLs and inadequate production secrets.

---

## Exam Integrity Signals

MeasurePrep can record informational browser integrity events such as:

- Fullscreen changes
- Page visibility changes
- Window focus loss

These signals can support review and analytics.

They should not be treated as definitive evidence of misconduct on their own.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| UI Runtime | React |
| Backend | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | MySQL |
| Cache / Timers | Redis |
| Object Storage | MinIO / S3-compatible storage |
| Validation | class-validator / Zod |
| Email | SMTP / Nodemailer |
| API Documentation | Swagger / OpenAPI |
| Containers | Docker / Docker Compose |
| Reverse Proxy / TLS | Nginx |
| Package Manager | pnpm |

---

## Architecture

MeasurePrep uses a monorepo containing separate web, API, shared-type, database, infrastructure, and operational components.

```text
.
├── apps/
│   ├── api/                 # NestJS REST API
│   └── web/                 # Next.js application
│
├── packages/
│   └── shared-types/        # Shared interfaces and Zod schemas
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Prisma migrations
│   └── seed.ts              # Idempotent seed data
│
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│
├── scripts/
│   ├── smoke.ps1
│   ├── backup.ps1
│   ├── restore.ps1
│   ├── generate-dev-certs.ps1
│   └── new-production-env.ps1
│
└── package.json
```

---

## REST API

The backend exposes a versioned REST API through NestJS.

Default development endpoint:

```text
http://localhost:3001/api/v1
```

Interactive Swagger / OpenAPI documentation is available at:

```text
http://localhost:3001/api/docs
```

The API covers workflows including:

- Authentication
- Candidate sessions
- Exam forms
- Sections
- Questions
- Answers
- Autosave
- Submission
- Scoring
- Review
- Media
- Analytics
- Content administration
- Feature flags

---

## Docker Development Environment

MeasurePrep can run as a containerized development stack.

The host does not need local installations of MySQL, Redis, or MinIO when the Docker environment is used.

### Requirements

Install:

- Docker Desktop or Docker Engine
- Docker Compose

Docker Desktop users should use **Linux containers**.

---

## Quick Start

Clone the repository:

```bash
git clone https://github.com/ildrm/quiz.git
cd quiz
```

Create the development environment file.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Build the application images:

```bash
docker compose --env-file .env -f infra/docker-compose.yml build api web migrate seed
```

Start the complete stack:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

Check container status:

```bash
docker compose --env-file .env -f infra/docker-compose.yml ps -a
```

Expected state:

```text
mysql       Up (healthy)
redis       Up (healthy)
minio       Up
mailpit     Up
api         Up
web         Up
migrate     Exited (0)
seed        Exited (0)
```

---

## Development URLs

After the stack starts:

| Service | URL |
|---|---|
| Web application | `http://localhost:3000` |
| REST API | `http://localhost:3001/api/v1` |
| Swagger API documentation | `http://localhost:3001/api/docs` |
| MinIO console | `http://localhost:9001` |
| Development email inbox | `http://localhost:8025` |
| Readiness endpoint | `http://localhost:3001/api/v1/health/ready` |

---

## Demo Accounts

The development seed creates example accounts.

### Student

```text
Email: student@exam.local
Password: Practice123!
```

### Administrator

```text
Email: admin@exam.local
Password: Practice123!
```

These credentials are intended only for local development and testing.

Never use them in production.

---

## Seed Data

The idempotent seed creates example content for:

- IELTS Academic
- IELTS General Training
- TOEFL
- GRE

It also initializes:

- Test forms
- Exam sections
- Questions
- Scoring tables
- Protected listening assets
- Adaptive GRE routes
- Development users
- Disabled-by-default AI feature flags

Running the seed repeatedly should not create duplicate baseline data.

---

## Local Development Without Full Docker Application Containers

Developers can run infrastructure services separately and start the Node.js applications locally.

Install dependencies:

```bash
corepack pnpm install
```

Generate the Prisma client:

```bash
corepack pnpm db:generate
```

Run database migrations:

```bash
corepack pnpm db:migrate
```

Seed the database:

```bash
corepack pnpm db:seed
```

Start development servers:

```bash
corepack pnpm dev
```

---

## Testing and Verification

Run TypeScript validation:

```bash
corepack pnpm typecheck
```

Run tests:

```bash
corepack pnpm test
```

Create production builds:

```bash
corepack pnpm build
```

Validate Docker Compose:

```bash
docker compose --env-file .env -f infra/docker-compose.yml config --quiet
```

---

## End-to-End Smoke Test

A PowerShell smoke-test script is included:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke.ps1
```

The smoke test verifies important integration workflows including:

- Authentication
- Database readiness
- Redis readiness
- SMTP readiness
- Password-reset email submission
- Answer autosave
- Deterministic scoring
- Answer review
- Protected listening media
- GRE adaptive routing
- TOEFL scoring
- Item reporting
- Analytics
- Feature-flag access

---

## Operational Behavior

### Authoritative Timers

Exam deadlines are persisted in the database.

Redis mirrors active timers for fast access, but the database deadline remains authoritative.

The API validates deadlines during both reads and writes and can expire sessions even if the candidate disconnects.

Pending browser changes are flushed before manual section submission.

### Protected Exam Data

During an active attempt, candidate payloads do not expose sensitive assessment data such as:

- Answer keys
- Correct-option markers
- Listening transcripts

Those values become available only when appropriate after submission.

### Protected Media

Listening media and speaking recordings require authenticated access.

The API verifies that the authenticated candidate owns the associated attempt before allowing candidate-specific media operations.

---

## AI Configuration

AI-assisted scoring requires both application configuration and feature activation.

Example configuration:

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
AI_SCORING_ENABLED=true
```

The corresponding `AI_SCORING` feature flag must also be enabled through the administration interface.

Speaking transcription additionally requires:

```env
STT_BASE_URL=
STT_API_KEY=
STT_MODEL=
```

and the `TRANSCRIPTION` feature flag.

If AI evaluation fails validation or a provider is unavailable, the attempt can be moved to:

```text
MANUAL_REVIEW
```

This prevents external AI services from becoming a hard dependency for completing an assessment.

---

## Scoring Notes

MeasurePrep is a **practice and preparation system**.

Scores produced by the platform are practice estimates and should not be represented as official scores issued by an examination provider.

The bundled exam forms were reviewed against official exam-format and scoring guidance on **August 2, 2026**.

Relevant official references include:

- [IELTS Academic test format](https://ielts.org/take-a-test/test-types/ielts-academic-test)
- [IELTS scoring guidance](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [TOEFL iBT test content](https://www.ets.org/toefl/test-takers/ibt/about/content.html.html)
- [TOEFL score guidance](https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html)
- [GRE General Test structure](https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html)

Exam formats and scoring systems can change.

New or materially modified assessment forms should therefore be checked against the latest official guidance before publication.

AI scoring should additionally be calibrated against qualified human raters before being used for consequential evaluation.

---

## Production Deployment

Create a production environment containing strong random credentials for:

- Database authentication
- JWT secrets
- Object storage
- SMTP
- Application services

A production environment can be generated with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/new-production-env.ps1 `
  -Domain practice.example.com `
  -SmtpHost smtp.example.com `
  -SmtpUser smtp-user `
  -SmtpPassword 'provider-password' `
  -EmailFrom 'MeasurePrep <no-reply@example.com>'
```

Install trusted TLS certificates as:

```text
infra/nginx/certs/fullchain.pem
infra/nginx/certs/privkey.pem
```

For local TLS testing, a temporary self-signed certificate can be generated with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-dev-certs.ps1
```

Deploy using the production Compose configuration:

```bash
docker compose \
  --env-file .env.production \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.prod.yml \
  build api web migrate seed
```

Then start the services:

```bash
docker compose \
  --env-file .env.production \
  -f infra/docker-compose.yml \
  -f infra/docker-compose.prod.yml \
  up -d
```

The API performs production configuration validation and rejects several unsafe configurations, including example credentials, inadequate JWT secrets, non-HTTPS public URLs, and missing SMTP configuration.

---

## Backup

Create a backup of MySQL and MinIO data:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup.ps1
```

Backups are stored under the git-ignored:

```text
backups/
```

directory using timestamped folders.

---

## Restore

Restore a selected backup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore.ps1 `
  -BackupDirectory .\backups\YYYYMMDD-HHMMSS `
  -ConfirmRestore
```

Restart the application afterward:

```bash
docker compose --env-file .env -f infra/docker-compose.yml restart api web
```

Always verify that the selected backup belongs to the intended environment before restoring it.

---

## Rebuilding After Source Changes

Rebuild application-owned Docker images:

```bash
docker compose --env-file .env -f infra/docker-compose.yml build api web migrate seed
```

Restart the environment:

```bash
docker compose --env-file .env -f infra/docker-compose.yml up -d
```

Follow application logs:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs -f api web
```

Stop the stack without removing persistent volumes:

```bash
docker compose --env-file .env -f infra/docker-compose.yml down
```

---

## Troubleshooting

### Docker Desktop Linux Engine

If Docker reports a `dockerDesktopLinuxEngine` error, restart Docker Desktop and try again.

```bash
docker desktop restart
```

### Port Conflicts

Development services may require ports including:

```text
3000
3001
3306
6379
9000
9001
8025
```

Stop conflicting services or modify the published ports in the Docker Compose configuration.

### Migration or Seed Failure

Inspect:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs migrate seed
```

### API or Web Container Failure

Inspect:

```bash
docker compose --env-file .env -f infra/docker-compose.yml logs api web
```

---

## Use Cases

MeasurePrep can serve as a foundation for:

- IELTS practice websites
- TOEFL preparation platforms
- GRE preparation platforms
- Language-school assessment systems
- Online mock-exam services
- Computer-based testing platforms
- Adaptive testing systems
- Educational assessment software
- Exam analytics platforms
- AI-assisted assessment research
- Self-hosted examination systems
- EdTech products
- Test-preparation SaaS platforms

---

## Why MeasurePrep?

Many quiz applications focus only on displaying questions and calculating simple scores.

MeasurePrep is designed around the broader requirements of standardized exam preparation:

**practice → timed assessment → autosave → submission → scoring → review → analytics → improvement**

Its architecture combines:

- Realistic timed exam sessions
- Multiple standardized exam families
- Objective and subjective question types
- Adaptive assessment
- AI-assisted evaluation
- Secure media
- Candidate analytics
- Assessment analytics
- Content operations
- Production deployment tooling

This makes it suitable both as an exam-preparation application and as a foundation for more general computer-based assessment systems.

---

## Trademark and Affiliation Disclaimer

MeasurePrep is an independent software project.

It is **not affiliated with, endorsed by, sponsored by, or officially connected with** the British Council, IDP, Cambridge University Press & Assessment, Educational Testing Service (ETS), or any other examination provider.

IELTS, TOEFL, GRE, and other referenced examination names and trademarks belong to their respective owners.

Any scores generated by MeasurePrep are intended for practice and educational purposes and are not official examination results.

---

## Contributing

Contributions that improve the assessment engine, accessibility, security, analytics, documentation, exam workflows, testing, or developer experience are welcome when contribution access is available.

Before submitting substantial changes:

1. Keep business logic testable and explicit.
2. Preserve server-authoritative examination behavior.
3. Do not expose answer keys during active attempts.
4. Maintain backward compatibility where practical.
5. Add or update tests for changed behavior.
6. Run type checking and tests before submitting changes.

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

---

## Project Keywords

IELTS practice test, IELTS mock exam, IELTS preparation, IELTS Academic practice, IELTS General Training, TOEFL practice test, TOEFL iBT preparation, TOEFL mock exam, GRE practice test, GRE preparation, GRE mock exam, adaptive testing, computer-based testing, online examination system, exam simulator, assessment platform, test preparation software, AI exam scoring, AI assessment, writing evaluation, speaking evaluation, exam analytics, EdTech, Next.js, NestJS, TypeScript, Prisma, MySQL, Redis, MinIO, Docker.

---

**MeasurePrep** — practice, measure, understand, and improve exam performance.
