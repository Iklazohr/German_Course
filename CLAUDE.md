# CLAUDE.md — German Course (Tedesco Facile)

## Regole di Lavoro

- **Lingua**: l'utente parla italiano, rispondi sempre in italiano
- **Branch**: va bene creare un branch locale per le modifiche, ma si pusha sempre e solo su `main`. Dopo il push su main, cancellare il branch creato
- **Plan mode**: usa sempre la plan mode con impostazione `/model opusplan` (Opus per la pianificazione, Sonnet per l'esecuzione)

## Project Overview

Progressive Web App for learning German, targeted at Italian speakers. Covers levels A1 through C1 with lessons, exercises, flashcards, and grammar theory. Fully client-side with offline support via Service Worker.

## Tech Stack

- **Vanilla JavaScript** (ES6 modules, no build step, no bundler)
- **Plain HTML/CSS** (no preprocessors)
- **Firebase** — Authentication (email + Google) and Firestore for cloud sync
- **Motion.js** (v12.38.0) — animations
- **Web Audio API** — synthesized sound effects
- **Service Worker** — offline-first caching (sw.js)

## Project Structure

```
├── index.html              # SPA entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline caching)
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project reference
├── package.json            # Only dependency: motion
├── js/
│   ├── app.js              # Entry point, routing setup, initialization
│   ├── router.js           # Hash-based SPA router with params
│   ├── store.js            # State management (localStorage + Firestore)
│   ├── renderer.js         # DOM utilities, data loading, German text normalization
│   ├── audio.js            # Web Audio API sound effects
│   ├── auth.js             # Firebase authentication
│   ├── sync.js             # Firestore cloud sync with merge strategy
│   ├── firebase-config.js  # Firebase credentials
│   ├── friends.js          # Social features
│   ├── components/         # UI views (functional, DOM-manipulating)
│   │   ├── dashboard.js
│   │   ├── levels-view.js
│   │   ├── lesson-view.js
│   │   ├── exercise-view.js
│   │   ├── flashcards-view.js
│   │   ├── theory-view.js
│   │   ├── progress-view.js
│   │   ├── settings-view.js
│   │   └── auth-view.js
│   └── exercises/          # Exercise type renderers
│       ├── multiple-choice.js
│       ├── fill-blanks.js
│       ├── matching.js
│       ├── translation.js
│       ├── reorder.js
│       └── select-article.js
├── css/
│   └── style.css           # All styles (responsive, dark mode, animations)
├── data/                   # Course content (JSON)
│   ├── a1/, a2/, b1/, b2/, c1/  # Lessons & exercises per level
│   └── flashcards/         # Flashcard decks
└── assets/                 # Icons and static assets
```

## Key Architecture Patterns

- **No build step** — ES6 modules served directly; Firebase SDK loaded from CDN
- **Hash-based routing** — `router.js` uses `#/path/:param` patterns
- **State in localStorage** — Key: `germanCourse` (JSON blob); cloud sync is optional
- **Cloud sync** — Firestore `users/{uid}`, debounced 2s after local changes, merge strategy (cloud wins if newer/higher score)
- **Components** — Functions that directly manipulate `document.getElementById('app')`, not returning markup
- **Exercise flow** — Generic container in `exercise-view.js` → delegates to type-specific renderer → standardized feedback
- **German normalization** — Umlaut conversion (ä→ae, ö→oe, ü→ue), whitespace trim, accent removal for answer comparison

## Development

### Running Locally

No build required. Serve the directory with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` (or the port shown). The app uses ES modules, so a file server is required (no `file://` protocol).

### Dependencies

```bash
npm install   # Only installs motion library
```

### Deployment

Deployment is automated via GitHub Actions on push to `main`:
- Workflow: `.github/workflows/firebase-deploy.yml`
- Deploys to Firebase Hosting (project `german-course-1cc9b`)
- Requires `FIREBASE_SERVICE_ACCOUNT` GitHub secret

### No Tests / No Linter

There is no test framework or linting configuration. Test changes manually in the browser. Check both mobile and desktop viewports, and verify dark mode.

## Code Conventions

- **camelCase** for variables and functions
- **Render prefix** for component functions (e.g., `renderDashboard`, `renderLessonView`)
- **Lesson/exercise IDs** follow the pattern `a1-g01`, `b2-v03` (level-type-number)
- **UI language** is Italian; course content is German
- **No TypeScript, no JSDoc** — keep it plain JS
- **Dark mode** — all CSS changes go through `.dark-mode` class; respect existing patterns in `style.css`
- **Animations** — use JS-driven animations (Web Animations API or Motion.js), not CSS `@keyframes`, due to desktop Chrome compatibility issues (see commit history)

## Content Structure

- **5 levels**: A1 (8 units), A2 (8 units), B1 (7 units), B2 (3 units), C1 (3 units)
- **144 total lessons** across 29 units
- **6 exercise types**: multiple-choice, fill-blanks, matching, translation, reorder, select-article
- Data lives in `data/{level}/` as JSON files

## Common Pitfalls

- **Animations on desktop** — CSS animations have historically broken on desktop Chrome; prefer JS-based animation approaches (see recent fix commits)
- **Service Worker caching** — After changing files, update the file list in `sw.js` to bust the cache. Headers are set to `no-cache` in `firebase.json` but the SW still caches aggressively
- **Firebase SDK** — Loaded dynamically from CDN, not from `node_modules`; do not add Firebase to `package.json`
- **Offline-first** — All features must work without network; don't add server-dependent features without a fallback
