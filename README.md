# Local Todo (Next.js)

Simple local-only todo app built with Next.js (App Router) and TypeScript.

## Run

```bash
nvm use
npm install
npm run dev
```

Open http://localhost:3000

## Notes

- Use Node 22 LTS (see `.nvmrc`). Node 25 may cause Next.js runtime issues.
- Data is persisted in browser `localStorage`.
- No backend or database is required.
- To disable telemetry, set `NEXT_TELEMETRY_DISABLED=1` in `.env.local`.
