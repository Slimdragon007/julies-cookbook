# Julie's Cookbook

Multi-user recipe cookbook with nutritional tracking, food logging, and an AI chat assistant. Invite-only family app.

**Production:** https://julies-cookbook.pages.dev

## Stack

- Next.js 14 App Router
- Supabase (auth + Postgres)
- Tailwind (Liquid Glass / Magnolia palette)
- Anthropic SDK (chat assistant)
- USDA FoodData Central (nutrition)
- Cloudflare Pages (hosting, via `@cloudflare/next-on-pages` + GitHub Actions)

## Local development

```bash
npm install
npm run dev          # localhost:3000
npm run lint         # ESLint
npm run test         # Vitest
npm run test:e2e     # Playwright (needs dev server)
npm run build:cf     # canonical Cloudflare Pages build
npm run preview      # local Wrangler preview of the Cloudflare build
```

Env vars: see [`docs/REFERENCE.md`](docs/REFERENCE.md).

## Project handbook

See [`CLAUDE.md`](CLAUDE.md) for the engineering law (rules, pitfalls, current state). Architect-owned task state lives in [`task_plan.md`](task_plan.md); completed work is logged in [`progress.md`](progress.md).
