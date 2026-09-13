# Phoneme Studio — Assessment 1

This project was created by running the required command in an empty directory:

```bash
npx create-next-app .
```

The recommended defaults were selected: TypeScript, ESLint, Tailwind CSS and the App Router, without a `src/` directory or React Compiler. The initializer used `create-next-app@16.3.5`; its original **Initial commit from Create Next App** is preserved in the Git history archive described below. The classroom activities were then added to the generated project.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. All five pages are available: Home, About, Wordle, Word Search and Settings.

```bash
npm run build
```

The project uses Next.js static export (`output: 'export'`). The production website is generated in `out/` and can be served by any static web host. `npm run dev` runs the builder locally; downloaded activity files can be opened directly in a browser.

## Classroom workflow

1. Open Wordle or Word Search and set the title, instructions, difficulty and support options.
2. Play the live student preview.
3. Select **Generate HTML**. Open the downloaded `.html` file in a normal browser; no internet connection or additional files are needed.

Theme and layout preferences are saved in browser cookies.

## Component structure

- `app/`: Next.js App Router pages, root layout, metadata and styles.
- `components/studio/`: reusable navigation, activity settings, live preview, preferences and page components.
- `components/ui/`: accessible interface primitives used by the application.
- `lib/studio/data.ts`: HCE keyboard, sound cues, built-in word choices and difficulty presets.
- `lib/studio/hce-corpus.json`: all 90 word records extracted from the supplied DOCX, with source phoneme boundaries intact.
- `lib/studio/hce-keyboard.json`: the 43-symbol keyboard from the same document.
- `lib/studio/word-search-examples.json`: the ten space-tokenised examples from the supplied HTML.
- `reference/`: unchanged copies of both supplied files for provenance.
- `lib/studio/engine.ts`: duplicate-aware Wordle scoring, seeded word placement and selection geometry.
- `lib/studio/runtime.js`: standalone game controls and rendering.
- `lib/studio/export.ts`: self-contained HTML generation; preview and download use the same output.

This implementation uses standard `next dev` and `next build` commands. It does not use Vinext, Vite, a database or a server API.

## Assessment scope

Wordle uses one selected word per activity from the supplied HCE corpus: 30 three-phoneme words, 30 four-phoneme words and 30 five-phoneme words. The default is `/tɹæɪn/` (train). The grid adapts to the selected word and allows 8, 6 or 4 guesses. It accepts phoneme sequences without dictionary validation; the corpus is the teacher’s fixed answer pool.

Word Search adapts `Phoneme Word Search.html`. Its five-word Assessment 1 preset is chin, bait, jam, bad and boot; the full preset adds log, ring, fan, van and sun. Difficulty suggests 7×7, 10×10 or 12×12 grids and controls placement directions. Teachers can independently set rows and columns from 6 to 16. Filler cells use phonemes from the selected words, and every displayed word must be placed successfully. Seeded generation keeps the preview and download identical.

Activities include sound hints on hover and focus, optional English cues, keyboard navigation, untimed gameplay, visible focus indicators and feedback expressed with text and symbols as well as colour. Word Search supports pointer dragging, two-click/tap selection, arrow-key navigation and answer reveal. Reveal does not mark words as found. Drag paths preserve their actual start and end, including reverse and diagonal drags.

There is no student tracking, account system or dynamic word-list management in Assessment 1. The fixed word data can be replaced with database-backed content in Assessment 2. Offline files contain their answers and are intended for learning, rather than secure tests. The supplied broad HCE transcriptions are retained. Multi-character sounds, including tʃ, dʒ, æɪ, ʉː and ɪə, each occupy one tile. The source uses both Latin g and IPA ɡ for the same sound; game data canonicalises these to ɡ while keeping the original JSON transcriptions and source files unchanged.

## Original development history

This GitHub upload contains the completed source snapshot. The original development commits, including the initial `create-next-app` commit, are preserved in `reference/phoneme-studio-history.bundle`. To inspect them in a separate folder, run:

```bash
git clone reference/phoneme-studio-history.bundle ../phoneme-studio-original-history
```
