# Assessment 2 recording and submission guide

Record your own demonstration with your face visible and narration throughout. Show your student ID within the first 30 seconds. The application cannot produce this personal identity demonstration for you.

## Prepare

- Install Docker Desktop/Engine and start it.
- Run `docker compose up --build -d`, then open http://localhost:3000.
- Keep a terminal, your editor with `prisma/schema.prisma`, and the app ready.
- Use a temporary list for the demonstration so you can show deletions safely.

## Suggested recording sequence

| Time      | What to show                                                                                 | What to explain                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 0:00–0:25 | Face camera and your student ID                                                              | Introduce Samuel Karanja, 22301707, and Assessment 2                                             |
| 0:25–1:00 | Home and navigation                                                                          | Assessment 1's interface now uses a Next.js backend and persistent database                      |
| 1:00–2:00 | Word library: create a list named Demo practice, add `chin` with `tʃ ɪ n` and a hint         | One phoneme can contain several Unicode characters; three tokens become three tiles              |
| 2:00–2:40 | Reload to read the saved word, edit its hint, add and delete a spare word                    | Demonstrate all word CRUD operations; reload proves retrieval from the backend                   |
| 2:40–3:20 | Try an unknown token, then correct it; open the phoneme library                              | Clear validation messages; phoneme symbols and their English cues are database records           |
| 3:20–4:10 | Wordle: choose the saved list and chin, set Gentle difficulty, save and play the preview   | Controls load stored data; saved configuration has a database ID; solve with tʃ, ɪ, n and Enter  |
| 4:10–4:50 | Save & generate HTML; open the downloaded file in a normal browser                           | The server reads saved settings and words; the downloaded file runs independently                |
| 4:50–5:40 | Word Search: choose the five-word example list, select five words, save and generate         | Both activity types use database content; show an actual word selection and phoneme hint         |
| 5:40–6:20 | Saved activities: reopen, edit title/difficulty, save as new, delete the spare configuration | Multiple stored configurations and complete activity CRUD                                        |
| 6:20–7:10 | Editor: schema, a route handler, validation and savedHtml                                    | Ordered WordSound rows, Prisma relationships, transactions and generated output workflow         |
| 7:10–7:40 | Terminal: `docker compose ps` and `curl -i http://localhost:3000/health`                     | Explicitly show running container and HTTP 200 OK from a database-aware health check             |
| 7:40–8:15 | `docker compose restart`, reload saved content                                               | SQLite persists in a named volume; seed data does not overwrite teacher changes                  |
| 8:15–9:00 | Interface, keyboard focus and phone preview                                                  | Reusable components, accessibility, feedback, SQLite/single-user trade-offs and future expansion |

If a word is used by a saved activity, deletion returns a clear conflict. Demonstrate this if useful, then delete the activity before deleting that word. Finish by deleting only the spare demo records you created.

## Technical explanation prompts

- Why use Next.js route handlers alongside the existing React components?
- Why does the database use ordered WordSound rows instead of splitting a spelling string?
- How do server validation, foreign keys and transactions protect saved activities?
- How does the HTML endpoint prove generation uses stored data?
- What makes the downloaded HTML self-contained?
- Why does SQLite suit this assessment, and what would change for multiple teachers on a public server?
- How do labeled controls, untimed play, full-symbol buttons, phoneme cues and text feedback support Speech Pathology teaching?
- Why is there a Docker data volume, and what does the health check actually query?

## Submission

- Submit the provided Assessment 2 source ZIP, which excludes `node_modules`, local database files, build output and local environment files.
- Include the repository link: https://github.com/Cui2004z/phoneme-studio.
- The repository is private; ensure your assessor has access using your course's submission process.
- Include your recorded walkthrough using the LMS's required video submission method.
- Confirm that a fresh extraction works with `npm ci` and `npm run db:setup`, or with `docker compose up --build`.
