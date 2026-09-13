# Phoneme Studio — Assessment 2

A classroom activity builder for Speech Pathology teaching. Manage phoneme word lists, prepare Wordle and Word Search activities, and download each activity as one playable HTML file.

**Repository:** [Cui2004z/phoneme-studio](https://github.com/Cui2004z/phoneme-studio)

## Project continuity

Assessment 2 extends the Assessment 1 React interface with a Next.js backend, Prisma ORM and SQLite database. The original application was initialized in an empty directory using:

```bash
npx create-next-app .
```

The starter used TypeScript, ESLint, Tailwind CSS and the App Router. Its original Create Next App history is preserved in `reference/phoneme-studio-history.bundle`; the supplied corpus DOCX and example HTML are also retained in `reference/`. This version runs as a Node.js server rather than a static export.

## Run locally

Install Node.js 22.12 or newer, then:

```bash
npm ci
npm run db:setup
npm run dev
```

Open [localhost:3000](http://localhost:3000). Setup creates a local `.env`, applies the committed migrations and seeds the database once. Re-running setup preserves your edits and deletions.

For a production build:

```bash
npm run build
npm start
```

The local database is `prisma/dev.db`. Keep it when updating the application. The source archive does not include a populated database; setup creates it reproducibly.

## Run with Docker

With Docker Engine or Docker Desktop running:

```bash
docker compose up --build -d
docker compose ps
curl -i http://localhost:3000/health
```

Open [localhost:3000](http://localhost:3000). The health response is **200 OK** when the app can query its migrated database. The container applies migrations and seeds missing initial data automatically, runs as a non-root user, and stores SQLite in the named `phoneme-data` volume.

```bash
docker compose restart
docker compose down
```

Both commands preserve saved content. Removing the volume also removes the database. The Compose port binds to localhost; this is a trusted, single-teacher workspace without accounts or student tracking. Public multi-user hosting would need authentication, authorization and a reviewed deployment configuration.

## Classroom workflow

1. Open **Word library**, create a list, and add English words with space-separated phonemes and optional hints. A token such as `tʃ` or `ʉː` occupies one sound position. The phoneme keyboard helps enter symbols; its labels and examples can also be edited.
2. Open **Wordle** or **Word Search**. Choose a saved list and target word or search words, difficulty, support options and activity appearance.
3. Try the live student preview. Choose **Save activity** to keep the configuration, or **Save & generate HTML** to save and download it together.
4. Reopen, edit, copy, download or delete configurations from **Saved activities**. Downloaded files work offline in a normal browser.

The seed imports the supplied 90-word HCE corpus, a five-word search list, the ten-word example list, 43 phonemes and three difficulty presets. These are database records that teachers can change, not a fixed frontend answer pool. Wordle uses one selected target per saved activity. Word Search supports up to 12 distinct phoneme sequences and 6–16 rows and columns.

Hints appear on hover and keyboard focus. Games support untimed play, visible focus, text and symbol feedback, and optional English cues. Interface appearance and layout preferences remain in browser cookies; classroom content and activity settings are stored in SQLite.

## Development and verification

```bash
npm run lint
npm test
npm run build
```

`npm test` creates a temporary database, applies migrations, seeds it and tests the real HTTP routes. It checks CRUD, validation, relationship protection, multi-character phonemes, saved HTML output and idempotent seeding. It does not use or erase the development database.

To inspect the database locally:

```bash
npm run db:studio
```

To run the same HTTP tests against an already-running Docker application:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 npm run test:api
```

The test suite creates temporary test records and deletes them after successful checks. GitHub Actions also builds and starts the Docker image and verifies that data survives a container restart.

## Code structure

| Location             | Responsibility                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| `app/`               | Page routes, HTTP API handlers and `/health`                             |
| `components/studio/` | Shared shell, list editors, builders, previews and saved activities      |
| `lib/client/`        | API requests, user-facing errors and saved-file downloads                |
| `lib/server/`        | Prisma access, input validation, transactions and stored-data generation |
| `lib/studio/`        | Shared types, game rules and self-contained HTML rendering               |
| `prisma/`            | Schema, versioned migrations, one-time seed and source data              |
| `scripts/`           | Setup, container startup and verification utilities                      |
| `tests/`             | HTTP integration checks                                                  |

See [architecture and API documentation](docs/architecture.md) for the data model, request contracts and design trade-offs.
