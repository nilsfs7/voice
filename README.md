# Voice

Official freestyle football community governance app (part of FSMeet).

## Stack

- Next.js (port **3004**)
- MySQL (`snake_case` schema in `db/schema.sql`)
- FSMeet OAuth
- Docker / GitHub Actions → Docker Hub (`nilsfs7/fsmeet-voice`)

## Local development

```bash
cp .env.example .env
docker compose up -d mysql adminer
npm install
npm run dev
```

Schema/migrations apply automatically on server start when `DATABASE_URL` is set (TECH-14). Manual: `npm run db:migrate`.

Open http://localhost:3004 · Adminer (DB UI): http://localhost:9080  
Login: System **MySQL**, Server **mysql**, Username **voice**, Password **voice**, Database **voice**.  
Containers: `voice-db`, `voice-adminer`.

Set `FSMEET_OAUTH_CLIENT_ID` (and secret if required) to a client registered on FSMeet.

## Product requirements

See [`AGENTS.md`](./AGENTS.md).
