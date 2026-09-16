# Phoneme Studio

A Wordle and Word Search builder for Speech Pathology teaching. Teachers can manage phoneme word lists, save activity settings and download games as standalone HTML files.

Built with Next.js, React, TypeScript, Prisma and SQLite. Assessment 2 adds database storage and APIs to the Assessment 1 frontend. The original project was created with `npx create-next-app .`.

## Run with Docker

Start Docker Desktop, then open a terminal in the folder containing `compose.yaml`:

```bash
docker compose up --build -d
```

Open [localhost:3000](http://localhost:3000). Migrations and starter data are loaded automatically.

Check the container and database connection:

```bash
docker compose ps
curl -i http://localhost:3000/health
```

Use `curl.exe` in Windows PowerShell. A working database returns **200 OK**.

Stop the app with `docker compose down`. Saved content stays in the `phoneme-data` volume. Adding `-v` removes that volume and its data.

## Run without Docker

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run db:setup
npm run dev
```

Open [localhost:3000](http://localhost:3000). The local database is `prisma/dev.db`. Running setup again preserves existing content.

For production, run `npm run build`, then `npm start`.

## Using the builder

1. In **Word library**, create a list and add words, phonemes and hints. Separate sounds with spaces, for example `tʃ ɪ n` for chin.
2. Open **Wordle** or **Word Search**, choose a saved list and select the words to use.
3. Adjust the settings and try the preview.
4. Select **Save & generate HTML** to save the activity and download it.
5. Use **Saved activities** to reopen, edit or delete configurations.

Each phoneme occupies one tile, including symbols such as `tʃ` and `ʉː`. Downloaded games work offline.

## Database

The starter data comes from the supplied HCE corpus and Word Search examples. It includes the 90-word corpus, five- and ten-word search lists, 43 phonemes and three difficulty presets. Teachers can edit these records through the app.

Words used by saved activities are protected from deletion. Remove their activity references first. Seeding runs once and does not restore entries that a teacher has deleted.

This version is intended for a single teacher running one server. It has no user accounts. Interface preferences use cookies; word lists and activity settings use SQLite.

## Checks

```bash
npm run lint
npm test
npm run build
```

The tests use a temporary database. GitHub Actions also checks the Docker build, APIs and persistence after a restart. See the [test results](docs/verification.md).

## Project files

- `app/` — pages, API routes and the health endpoint.
- `components/studio/` — builders, word editors and shared interface components.
- `lib/server/` — database access and validation.
- `lib/studio/` — game rules and HTML generation.
- `prisma/` — schema, migrations and seed data.
- `tests/` — API integration tests.
- `reference/` — supplied source files and the original starter history bundle.

[Database and API notes](docs/architecture.md) · [GitHub repository](https://github.com/Cui2004z/phoneme-studio)
