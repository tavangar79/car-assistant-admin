# Car Assistant Admin

Admin panel for the Car Assistant API: dashboard, users (block/unblock, profile edit, read-only
records) and the service catalog as a global → make → model → trim tree. React 19 + Vite +
TypeScript + shadcn/ui.

## Run

```bash
npm install
cp .env.example .env     # VITE_API_BASE_URL=http://localhost:3000
npm run dev              # http://localhost:5173
```

The backend must be running, with `http://localhost:5173` in its `CORS_ORIGINS`. Create the admin account in
the backend with `npm run admin:setup -- <username>`, then sign in with the username, password and the
6-digit code from your authenticator app.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

The API contract is `API-ADMIN.md` in the car-assistant manager repo. Conventions are in `CLAUDE.md`.
