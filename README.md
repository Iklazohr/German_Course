# Tedesco Facile

**Corso di tedesco per italiani — dal livello A1 al C1.**

Progressive Web App completamente client-side per imparare il tedesco partendo dall'italiano. Funziona offline, si installa come app nativa e sincronizza i progressi nel cloud.

## Funzionalita

- **5 livelli CEFR** — A1, A2, B1, B2, C1 con 149 lezioni totali distribuite in 29 unita
- **8 tipi di esercizi** — scelta multipla, riempi gli spazi, abbinamento, traduzione, riordina, seleziona articolo, ascolto, parlato
- **Flashcard** — 10 mazzi di carte (nomi e verbi) per ogni livello
- **Teoria grammaticale** — sezione dedicata con spiegazioni in italiano
- **Modalita offline** — Service Worker per funzionamento senza connessione
- **Tema scuro** — supporto completo per dark mode
- **Sincronizzazione cloud** — login con email o Google per salvare i progressi su piu dispositivi
- **Streak e progressi** — tracciamento giornaliero e statistiche dettagliate
- **Installabile** — PWA con supporto per aggiunta alla home screen

## Tech Stack

| Tecnologia | Utilizzo |
|---|---|
| Vanilla JS (ES6 modules) | Logica applicativa, nessun framework |
| HTML / CSS | Interfaccia responsive, mobile-first |
| Firebase Auth | Autenticazione (email + Google) |
| Firestore | Sincronizzazione cloud dei progressi |
| Motion.js | Animazioni fluide |
| Web Audio API | Effetti sonori sintetizzati |
| Service Worker | Caching offline-first |

## Avvio rapido

Non serve nessun build step. Basta un server statico:

```bash
# Installa l'unica dipendenza
npm install

# Avvia un server locale
npx serve .
# oppure
python3 -m http.server 8000
```

Apri `http://localhost:8000` nel browser.

> **Nota:** l'app usa ES modules, quindi non funziona con il protocollo `file://`.

## Struttura del progetto

```
├── index.html              # Entry point SPA
├── manifest.json           # Manifest PWA
├── sw.js                   # Service Worker (caching offline)
├── js/
│   ├── app.js              # Inizializzazione e routing
│   ├── router.js           # Router hash-based (#/path/:param)
│   ├── store.js            # Stato (localStorage + Firestore)
│   ├── renderer.js         # Utility DOM e normalizzazione testo tedesco
│   ├── audio.js            # Effetti sonori (Web Audio API)
│   ├── auth.js             # Autenticazione Firebase
│   ├── sync.js             # Sincronizzazione Firestore
│   ├── components/         # Viste UI
│   │   ├── dashboard.js
│   │   ├── levels-view.js
│   │   ├── lesson-view.js
│   │   ├── exercise-view.js
│   │   ├── flashcards-view.js
│   │   ├── theory-view.js
│   │   ├── progress-view.js
│   │   ├── settings-view.js
│   │   └── auth-view.js
│   └── exercises/          # Renderer per tipo di esercizio
│       ├── multiple-choice.js
│       ├── fill-blanks.js
│       ├── matching.js
│       ├── translation.js
│       ├── reorder.js
│       ├── select-article.js
│       ├── listening.js
│       └── speaking.js
├── css/
│   ├── style.css           # Stili principali, responsive, dark mode
│   ├── components.css      # Stili componenti
│   └── exercises.css       # Stili esercizi
├── data/                   # Contenuti del corso (JSON)
│   ├── a1/ a2/ b1/ b2/ c1/
│   └── flashcards/         # Mazzi di flashcard per livello
└── assets/                 # Icone e risorse statiche
```

## Contenuti del corso

| Livello | Unita | Lezioni | Flashcard |
|---|---|---|---|
| A1 | 8 | 49 | Nomi, Verbi |
| A2 | 8 | 33 | Nomi, Verbi |
| B1 | 7 | 28 | Nomi, Verbi |
| B2 | 3 | 19 | Nomi, Verbi |
| C1 | 3 | 20 | Nomi, Verbi |
| **Totale** | **29** | **149** | **10 mazzi** |

## Deploy

Il deploy su Firebase Hosting e automatico tramite GitHub Actions ad ogni push su `main`:

```
.github/workflows/firebase-deploy.yml
```

Progetto Firebase: `german-course-1cc9b`

## Licenza

Progetto privato.
