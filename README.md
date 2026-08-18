# Mead Makers

A mead-brewing tracker — recipes, batches, and a bit of a social layer for friends — built primarily as a demonstration of a full Node/Express + MySQL + Next.js stack rather than as a polished product.

## Stack

**Backend** (`server/`)
- Node.js + Express + TypeScript
- MySQL + Prisma ORM
- Session-based auth (`express-session`, MySQL-backed store via `express-mysql-session`), passwords hashed with `bcryptjs`
- Jest (unit tests, mocked Prisma — no real DB touched)

**Frontend** (`client/`)
- Next.js (App Router) + React + TypeScript
- CSS Modules plus a small hand-rolled design system ("Classical," in `app/globals.css`) and Tailwind v4 utilities
- Jest + React Testing Library (mocked `fetch` / Next navigation hooks)

**Infra**
- Docker Compose: `mysql`, `server`, `client` services, all bind-mounted for hot reload against your local source

## Prerequisites

- Docker Desktop
- (Optional, for editor IntelliSense) Node.js locally — `node_modules` lives only inside the containers, so a host-side `npm install` in `server/`/`client/` is needed purely for your IDE to resolve imports

## Getting started

1. Copy the env file and adjust secrets/passwords as you like:
   ```
   cp .env.example .env
   ```
2. Build and start everything:
   ```
   docker compose up -d --build
   ```
3. Run the database migrations. This is a deliberate manual step — schema changes are hand-authored and reviewed before migrating, not auto-applied:
   ```
   docker compose exec server npm run prisma:migrate
   ```
4. Open:
   - Client: http://localhost:3000
   - Server API: http://localhost:4000 (health check at `/api/health`)
   - MySQL is published on **3307** on the host (not 3306), in case you already have a local MySQL install

## Project structure

```
server/
  prisma/schema.prisma   # source of truth for the DB schema (hand-edited, migrated manually)
  src/
    routes/              # URL -> controller mapping
    controllers/         # thin: parse req, call a service, shape the response
    services/            # business logic + Prisma queries ("fat services" -- Prisma has no place for model methods)
    middleware/          # requireAuth, errorHandler
    lib/                 # Prisma client singleton, session store
    test-utils/          # shared mock req/res/next + mock Prisma client for tests
    **/*.test.ts         # colocated unit tests (mocked Prisma/services)

client/
  app/                   # Next.js App Router pages: login, dashboard, recipes, batches, friends, settings
  components/            # shared UI: Sidebar, Topbar, forms, modals, UserProvider (auth context)
  hooks/                 # useApi (fetch wrapper that clears the user on a 401), useRequireUser (auth guard + redirect)
  components/**/*.test.tsx  # colocated component tests (mocked fetch/navigation/context)
```

## Environment variables

See `.env.example` for the full list with comments. The important ones:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma's connection string (container-to-container, host `mysql`) |
| `SESSION_SECRET` | Signs the session cookie |
| `CLIENT_ORIGIN` | Must exactly match the client's origin — required for cookies to work cross-origin with `credentials: true` |
| `MYSQL_HOST_PORT` | Host-published MySQL port (3307 by default, to avoid clashing with a local MySQL install) |
| `NEXT_PUBLIC_API_URL` | Where the client sends API requests |

## Common commands

```bash
# Start / stop
docker compose up -d
docker compose down

# Apply a docker-compose.yml change (env vars, volumes, ports) -- `restart` does NOT re-read these
docker compose up -d <service>

# Install a new package (writes back to package.json/lock on the host via the bind mount)
docker compose exec server npm install <package>
docker compose exec client npm install <package>

# Run tests
docker compose exec server npm test
docker compose exec client npm test

# Prisma migrations
docker compose exec server npm run prisma:migrate

# Logs
docker compose logs -f server
docker compose logs -f client
```

## Architecture notes

- **Auth**: email/password (10-character minimum), sessions stored in MySQL. `useRequireUser` on the client redirects to `/login` when there's no session; the `requireAuth` middleware does the equivalent for the API.
- **Ownership & authorization**: recipes and batches are always scoped to `req.session.userId` server-side, never a client-supplied id. Account deletion requires the requester to either own the account or have `role === "admin"`; deletes are soft (`deletedAt`), never hard.
- **Design system**: `client/app/globals.css` defines CSS custom properties for color/type/spacing plus a small component class layer (`.btn`, `.card`, `.field`, `.seg`, `.dialog`, etc.), originally derived from the wireframes in `wireframes/`.
- **Testing philosophy**: everything here is a unit test — Prisma, `fetch`, and Next.js navigation/context hooks are all mocked, so both suites run in seconds with no live server or database involved. They complement, rather than replace, manual end-to-end verification against the real stack.

## Known gaps

- No image upload yet — the schema has `imageUrl` columns, but storage (local disk, then S3) isn't wired up.
- No admin-promotion UI — `role` has to be set directly in the database.
- Friend search by name is inherently ambiguous when two users share a name; the API asks for an email instead of guessing.
- No UI yet for logging a batch's gravity readings or fermentation/racking/bottling dates.
