# YouShop Creator Match (`web/`)

Aplicação Next.js 16 (App Router + TypeScript + Tailwind CSS v4) do MVP **YouShop Creator Match**.

## Scripts disponíveis

```bash
npm install      # instala dependências (@google/genai, next, react, eslint, etc.)
npm test         # executa os testes unitários em lib/*.test.ts via node:test
npm run lint     # valida regras de ESLint e TypeScript do Next.js
npm run build    # gera o build de produção
npm run dev      # inicia servidor local em http://localhost:3000
```

## Variáveis de ambiente (`web/.env.local`)

- `GEMINI_API_KEY`: chave server-only da Gemini API (nunca exposta ao navegador). Se ausente, `/api/explain` usa fallback determinístico local.
- `GEMINI_MODEL`: modelo padrão `gemini-2.5-flash`.
