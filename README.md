# 🥋 ELO Battle

A minimal, fully static single-page app that lets **20 fixed players** compete in head-to-head matchups ranked by the **ELO rating system**.

> Spin-off of [Game of STICK ELO Tracker](https://github.com/Ipuch/game-of-stick-elo-tracker)

## Features

- 🥊 **Battle view** — random matchup picker, vote left/win/right/draw/skip
- 🏆 **Leaderboard** — sorted by ELO, with W/L/D stats
- 📜 **History** — last 200 matches with ELO deltas
- 💾 **LocalStorage** — all data persists in the browser, no backend needed
- 📱 **Mobile-first** — works great on phones

## Customize players

Edit **`public/js/players.js`** to set real names, Instagram handles, and photo URLs:

```js
const INITIAL_PLAYERS = [
  { name: "Alice",  instagram: "alice_ig",  photo: "https://..." },
  { name: "Bob",    instagram: "bob_ig",    photo: null },
  // ...
];
```

> ⚠️ Changing `players.js` **after first load** won't overwrite existing LocalStorage data. Clear browser storage or click "Reset all data" first.

## Deploy to GitHub Pages

Push to `main` — the GitHub Actions workflow deploys the `public/` directory automatically to GitHub Pages.

## Run locally (localhost:8000)

This project is a static site — you can serve the `public/` folder with any static file server. Example commands:

1) Python 3 (built-in):

```bash
python3 -m http.server 8000 --directory public
```

2) Node (serve package):

```bash
npx serve public -l 8000
```

Then open http://localhost:8000 in your browser.

## Tech stack

- Pure HTML + Vanilla JS + Vanilla CSS
- No build step, no dependencies
- Google Fonts (Inter) loaded from CDN
