# 🥋 ELO Battle — Static Web Spin-Off
## Full Technical Specification

> **Spin-off of:** [Game of STICK ELO Tracker](https://github.com/Ipuch/game-of-stick-elo-tracker)  
> **Hosting:** GitLab Pages (100% static, no backend)  
> **Storage:** Browser LocalStorage  
> **Stack:** Pure HTML + Vanilla JS + Vanilla CSS  
> **Author:** Pierre Puchaud

---

## 1. Purpose & Scope

A minimal, fully static, single-page web application that allows a group of **20 fixed players** to be ranked using the **ELO rating system**.

Users vote on who wins head-to-head matchups. Ratings update live in the browser and persist via LocalStorage. The site is deployable to GitLab Pages with zero configuration.

Optimized for mobile.

---

## 2. Players (20 static players)

The 20 players are **hardcoded** in `js/players.js`. Names to be filled in before first deploy. Picture, name, instagram. Fake data for now, but should be editable.

```js
// js/players.js
const INITIAL_PLAYERS = [
  "Player 01", "Player 02", "Player 03", "Player 04", "Player 05",
  "Player 06", "Player 07", "Player 08", "Player 09", "Player 10",
  "Player 11", "Player 12", "Player 13", "Player 14", "Player 15",
  "Player 16", "Player 17", "Player 18", "Player 19", "Player 20",
];
const INITIAL_ELO = 1200; // Starting ELO for all players
```

> **Note:** To customize player names, only `js/players.js` needs to be edited.

---

## 3. ELO Formula

Identical to the parent project (`eloScoring.ts`):

K-factor is fixed to 40.

```
Expected score:
  E_A = 1 / (1 + 10^((R_B - R_A) / 400))

Rating update:
  R_A' = R_A + K * (S_A - E_A)

Where:
  K     = 40  (default K-factor, matching parent project)
  S_A   = 1 (win), 0 (loss), 0.5 (draw)
```

---

## 4. Pages / Views

The app is a **single HTML page** (`index.html`) with **three tab views** toggled via JS:

### 4.1 🥊 BATTLE view (default)
- Displays two randomly selected players (LEFT vs RIGHT)
- Three action buttons:
  - `⬅ WIN LEFT`
  - `⚖ DRAW`
  - `WIN RIGHT ➡`
- A `↩ SKIP` link to skip the current pair
- After voting: ELO updates, confetti/flash animation, next pair drawn, You can have fun and vary the animations.
- Pair selection strategy: prefer players with fewer matches first, fall back to random
- Show the win and loss of ELO each time the user clicks on a WIN, or Draw button.

### 4.2 🏆 LEADERBOARD view
- Table of all 20 players sorted by ELO (highest first)
- Columns: `Rank | Player | ELO (+Diff since series of matches) | W | L | D | Matches`
- Top 3 highlighted with 🏆🥈🥉 emoji
- "Reset all data" button (with confirmation dialog)

### 4.3 📜 HISTORY view
- Chronological list of all recorded matches
- Each entry: `Player A vs Player B → Result | ±ELO change | timestamp`
- Max 200 entries displayed (most recent first)

---

## 5. File Structure

```
elo-battle/
├── index.html          # Single page, three tab views
├── css/
│   └── style.css       # All styles (dark theme, responsive)
├── js/
│   ├── players.js      # Static player list (EDIT THIS FILE)
│   ├── elo.js          # ELO formula (pure functions, no side effects)
│   ├── storage.js      # LocalStorage read/write helpers
│   ├── ui.js           # DOM rendering functions
│   └── app.js          # Main logic, event listeners, app init
├── .gitlab-ci.yml      # GitLab Pages CI/CD config
└── README.md
```

---

## 6. Data Model (LocalStorage)

Two keys stored in `localStorage`:

### `elo_players`
```json
[
  { "name": "Player 01", "elo": 1234, "wins": 3, "losses": 1, "draws": 0 },
  ...
]
```

### `elo_matches`
```json
[
  {
    "left":   "Player 01",
    "right":  "Player 04",
    "result": "left",
    "leftEloBefore":  1200,
    "rightEloBefore": 1200,
    "leftEloAfter":   1220,
    "rightEloAfter":  1180,
    "timestamp": "2026-03-14T14:00:00.000Z"
  },
  ...
]
```

---

## 7. Key JS Modules

### `elo.js`
```js
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateRatings(ratingA, ratingB, result, K = 40) {
  const eA = expectedScore(ratingA, ratingB);
  const eB = 1 - eA;
  const sA = result === 'left' ? 1 : result === 'draw' ? 0.5 : 0;
  const sB = 1 - sA;
  return {
    newA: Math.round(ratingA + K * (sA - eA)),
    newB: Math.round(ratingB + K * (sB - eB)),
  };
}
```

### `storage.js`
```js
function savePlayers(players) {
  localStorage.setItem('elo_players', JSON.stringify(players));
}
function loadPlayers() {
  return JSON.parse(localStorage.getItem('elo_players')) || null;
}
function saveMatches(matches) {
  localStorage.setItem('elo_matches', JSON.stringify(matches));
}
function loadMatches() {
  return JSON.parse(localStorage.getItem('elo_matches')) || [];
}
```

### `app.js` — Pair selection
```js
function pickPair(players) {
  // Sort by number of matches played (ascending) to ensure everyone plays
  const sorted = [...players].sort((a, b) =>
    (a.wins + a.losses + a.draws) - (b.wins + b.losses + b.draws)
  );
  const left = sorted[0];
  // Pick opponent at random from the rest
  const pool = sorted.slice(1);
  const right = pool[Math.floor(Math.random() * pool.length)];
  return [left, right];
}
```

---

## 8. UI / Design

| Token         | Value                    |
|---------------|--------------------------|
| Background    | `#0d0d0d` (near-black)   |
| Surface       | `#1a1a2e`                |
| Accent        | `#e94560` (red-pink)     |
| Text primary  | `#eaeaea`                |
| Text muted    | `#888`                   |
| Font          | `Inter`, sans-serif (Google Fonts) |
| Border radius | `12px`                   |

- **Mobile-first**, single-column layout on small screens
- **Responsive grid** (side-by-side cards) on tablets/desktop
- Smooth CSS transitions on button hover and tab change
- Flash animation on ELO change (green for gain, red for loss)

---

## 9. GitLab Pages CI/CD

```yaml
# .gitlab-ci.yml
pages:
  stage: deploy
  script:
    - echo "Deploying static site..."
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

> The entire site lives in the repo. The `public/` folder is the deploy target.  
> Copy all files into `public/` or configure `public/` as the root from the start.

**Recommended**: keep `public/` as the root folder of the static site:
```
public/
├── index.html
├── css/style.css
├── js/
└── README.md
```

---

## 10. Limitations & Explicit Non-Goals

| Scope item                            | Status       |
|---------------------------------------|--------------|
| Backend / database                    | ❌ Out of scope |
| User accounts / authentication        | ❌ Out of scope |
| Shared rankings across users/devices  | ❌ Out of scope (LocalStorage is per-browser) |
| Adding/removing players after deploy  | ❌ Out of scope (static list) |
| PDF export                            | ❌ Out of scope |
| Instagram export                      | ❌ Out of scope |
| ELO chart / history chart             | ❌ Out of scope |
| Elo inflation prevention              | ❌ Out of scope (kept for future) |

---

## 11. Future Extensions (Post-MVP)

- 🔗 **Shared leaderboard**: replace LocalStorage with Supabase or Firebase for multi-user shared state
- 📈 **ELO evolution chart**: line chart (could reuse ECharts like parent project)
- 🧠 **Smarter pair selection**: avoid recent rematches, prioritize close ELO gaps
- 🔄 **Import/export JSON**: download/upload full state for backup
- 🌐 **i18n**: French/English toggle

---

## 12. Estimated Scope

| File            | Est. lines |
|-----------------|-----------|
| `index.html`    | ~80       |
| `css/style.css` | ~200      |
| `js/players.js` | ~25       |
| `js/elo.js`     | ~25       |
| `js/storage.js` | ~20       |
| `js/ui.js`      | ~150      |
| `js/app.js`     | ~120      |
| `.gitlab-ci.yml`| ~10       |
| **Total**       | **~630**  |

**Estimated build time:** 2–4 hours for a clean first version.

---

*Spec written 2026-03-14 — Pierre Puchaud*
