# Brainstorm Bingo

A responsive, fully client-side bingo card generator for **Magic: The Gathering Commander** challenges. Generate a board, mark squares off as you play, customise the challenge list, and print a clean card — all in the browser, with no backend, database or server required.

The original application's identity is preserved: the Wizards of the Coast card-art background images, the Yusei Magic font, the title/subheader text, the original 61 challenges, and the difficulty-weighted board generation (harder challenges towards the centre, easier ones towards the edges).

## Features

- **Configurable board size** — 3×3 up to 8×8 (default 5×5)
- **Marking** — click/tap a square to mark or unmark it (keyboard accessible)
- **Free space** — optional; exact centre cell on odd sizes, top-left of the central four cells on even sizes (off by default, matching the original app)
- **Bingo item management** — add, edit, remove and re-difficulty challenges from a settings dialog
- **Difficulty weighting** — each item is Easy / Medium / Hard / Hardest; generation places harder items closer to the centre
- **Persistence** — items, board size, marks, board and background are saved to `localStorage` and survive refresh
- **Print** — purpose-built print layout (clean black-on-white board sized for A4/Letter) via the Print button
- **Reset to defaults** — restores the original 61 challenges, 5×5 size and a fresh board
- **17 background artworks** — one is chosen at random and kept; the "Background" button picks another

## Running locally

No build step is needed to run the app — `css/tailwind.css` is committed.

1. Clone the repository.
2. Open `index.html` directly in a browser, **or**
   serve the folder with any static file server, e.g.:
   ```bash
   npx serve .
   # or: python3 -m http.server
   ```

> Note: modern browsers all handle this fine from `file://`, but if you use a
> browser that restricts `localStorage` on `file://`, serve over HTTP instead —
> the app degrades gracefully and simply won't persist in that case.

## Building Tailwind (only needed when you change styles)

Styling is written with [Tailwind CSS](https://tailwindcss.com) utility classes in `index.html` and the `js/` files. The compiled stylesheet is committed to `css/tailwind.css`, so nothing needs building to run or deploy the site.

If you add new utility classes, regenerate the stylesheet:

```bash
npm install        # installs tailwindcss (dev-only dependency)
npm run build:css  # compiles css/input.css -> css/tailwind.css (minified)
npm run watch:css  # or watch mode while editing
```

## Deploying

The whole repository is a static site. Deploy the directory contents to any static host:

- **GitHub Pages**: push the repo, enable Pages from the repository root (no build step needed).
- **Cloudflare Pages / Netlify / Vercel**: set the build command to `npm install && npm run build:css` (optional — the committed CSS already works) with output directory `.`.
- **Any web server / CDN**: upload the folder.

## How the app works

### Bingo items

- The default list (61 Commander challenges, each with a difficulty of 1–4) lives in `js/bingo.js` as `DEFAULT_ITEMS`.
- Your personal copy (additions, edits, removals) is stored in `localStorage` under the key `brainstorm-bingo/v1`.
- Add items with the **Manage Items** dialog (duplicate and blank entries are rejected).
- Each item's difficulty affects board generation; new items default to Medium.

### Board size & generation

- Sizes 3×3 … 8×8. A board needs one unique item per cell (one fewer if Free space is on). If you don't have enough items, the app explains exactly how many are missing instead of generating an invalid board.
- Items are never duplicated on a single board.
- Difficulty weighting (generalised from the original 5×5 logic):
  - inner third of the board → difficulty 2–4
  - middle third → difficulty 1–3
  - outer third → difficulty 1–2
  - if a band has no unused items left, any unused item may fill the cell
- **New Board** regenerates the arrangement (marks are cleared; you're asked first if any squares are marked).

### Free space

- Off by default (the original app had no free space — that rule is preserved).
- Toggle it in the **Manage Items** dialog. Odd sizes use the exact centre cell; even sizes use the top-left of the central four cells.

### Persistence

`localStorage` (key `brainstorm-bingo/v1`) stores: the bingo items, board size, free-space setting, the current board (including which squares are marked), and the chosen background image. Everything survives a refresh. If `localStorage` is unavailable (e.g. blocked), the app still works, it just won't remember between visits. **Reset to defaults** (in the Manage Items dialog) restores the original items, the 5×5 size, turns free space off and generates a fresh board.

### Printing

The **Print** button uses a dedicated `@media print` layout: all controls, the header text, the background image and the footer are hidden; the board is rendered black-on-white, scaled to fit A4 or Letter with readable text and crisp cell borders, with a small "Generated <date>" header.

## Project structure

```
index.html            App shell: header, toolbar, board, items dialog, print header
css/
  input.css           Tailwind directives + cell sizing + @media print rules
  tailwind.css        Compiled Tailwind output (committed — the only CSS the app needs)
js/
  storage.js          Safe localStorage wrapper (feature-detects availability)
  bingo.js            Pure board-generation logic + default challenges (no DOM)
  ui.js               DOM rendering helpers (board, item list, modal, messages)
  app.js              Application state, actions and event wiring
img/                  17 background card-art images (© Wizards of the Coast)
tests/
  bingo.test.js       Unit tests for the generation logic (node tests/bingo.test.js)
  smoke.js            DOM smoke test (requires jsdom, see below)
tailwind.config.js    Tailwind content paths + font family
package.json          Tailwind as a dev-only dependency; build scripts
```

## Testing

```bash
node tests/bingo.test.js    # generation logic unit tests (no dependencies)
```

The DOM smoke test needs jsdom (kept out of the repo's devDependencies on purpose):

```bash
npm i --prefix /tmp/bbtest jsdom
NODE_PATH=/tmp/bbtest/node_modules node tests/smoke.js
```

## Credits

All card-art images in `img/` are owned by Wizards of the Coast.
