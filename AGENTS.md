# AGENTS.md — YouShop Creator Match

YouShop Creator Match is a demonstration MVP that ranks simulated creators against campaigns. Read `README.md` for product context.

## Language and data
- Keep identifiers, comments, logs, and code contracts in English.
- Keep website copy and LLM prompt prose in Brazilian Portuguese.
- Creator and campaign records are synthetic. Do not describe their metrics as real data.
- Keep `GEMINI_API_KEY` server-only; never expose or print secrets.

## Website (`web/`)
- The app uses Next.js 16. Read `web/AGENTS.md` and the relevant guides in `web/node_modules/next/dist/docs/` before changing Next.js APIs or configuration.
- Keep shared contracts in `web/lib/types.ts`; update the relevant documentation when a contract changes.
- Keep ranking deterministic in `web/lib/match.ts`. Gemini explanations are server-side and must retain a deterministic fallback.
- The `/api/explain` in-memory rate limit is per process. Production deployments with multiple instances need a shared rate-limit service or platform-level control.
- Run `cd web && npm test && npm run lint && npm run build` after website changes.

## Creator catalog
- `pipeline/generate_creators.py` uses only the Python standard library.
- If changing its source data or generation logic, regenerate `web/public/data/creators.json` and `campaigns.json`, then verify IDs and schema consistency.
