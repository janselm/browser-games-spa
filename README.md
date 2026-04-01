# Games SPA

A multi-game web application featuring Hangman, Word Search, Typegame, and Pong, with a password-protected admin panel for managing game content. The project is structured to make adding new games straightforward.

## Games

- **Hangman** — guess the word one letter at a time before the hangman is complete. Words are served in a randomised rotation per player session.
- **Word Search** — find all hidden words in a 15×15 letter grid. Words are placed in 8 directions; drag to select.
- **Typegame** — a typing speed and accuracy game with a difficulty-based leaderboard.
- **Pong** — the classic arcade game.

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Vue 3 + Vite + Tailwind CSS v3 + Vue Router 4 |
| Backend   | PHP 8.2, plain PDO (no framework) |
| Database  | PostgreSQL 14 |

## Project Structure

```
hangman/
├── backend/
│   ├── index.php               # Single entry point — routing and middleware
│   ├── .env.example            # Environment variable template
│   ├── config/
│   │   └── database.php        # PDO singleton factory (three DB connections)
│   ├── controllers/
│   │   ├── AdminController.php      # CRUD for words and leaderboard
│   │   ├── HangmanController.php    # Session-based word rotation
│   │   ├── TypegameController.php   # Leaderboard read/write
│   │   └── WordSearchController.php # Random word selection
│   └── schema/
│       ├── schema.sql          # Table definitions
│       └── seed.sql            # Initial data (admin user, sample words)
└── frontend/
    ├── src/
    │   ├── views/              # Page-level components
    │   ├── components/         # Shared and admin UI components
    │   ├── composables/        # useHangman.js, useWordSearch.js
    │   ├── services/api.js     # Centralised API client
    │   └── router/index.js     # Vue Router with admin auth guard
    └── public/
        └── .htaccess           # Apache rewrite rules (SPA routing + API proxy)
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp backend/.env.example backend/.env
```

The application uses two PostgreSQL databases:

- **games** — stores hangman words, word search words, sessions, and admin users
- **typegame** — stores leaderboard scores

Import the schema before first run:

```bash
psql -U postgres -d games    -f backend/schema/schema.sql
psql -U postgres -d typegame -f backend/schema/schema.sql
psql -U postgres -d games    -f backend/schema/seed.sql
```

## Dev Commands

To build and run locally:

```bash
# Backend — run from backend/
DB_NAME=games DB_USER=postgres DB_PASS= php -S localhost:8080 index.php

# Frontend — run from frontend/
npm install
npm run dev        # → http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:8080`.

## Admin Panel

The admin panel is accessible at `/admin`. Log in with the credentials created in `seed.sql`.

The panel provides:
- Add, edit, delete, and bulk-import hangman words (with hint and difficulty)
- Add, edit, delete, and bulk-import word search words (with category)
- View and delete typegame leaderboard entries
- Automatic logout after 10 minutes of inactivity

## Deployment

```bash
# Build the frontend
cd frontend && npm run build

# Copy dist/ to the web root
cp -r dist/* /path/to/web-root/

# Copy backend to the private directory (not web-accessible)
cp -r backend/* /path/to/private/
```

The `.htaccess` in the web root routes all `/api/*` requests to the private backend and handles Vue Router's HTML5 history mode for all other paths.
