# YouShop Creator Match (MVP)

Protótipo desenvolvido para o **Desafio de Inovação – Programa de Estágio YouShop 2027**, adaptado a partir da arquitetura de filtragem determinística + explicação assistida por IA do `opendoor-main`.

O **YouShop Creator Match** automatiza a filtragem e a curadoria de **creators** para campanhas de produtos físicos e digitais no ecossistema YouShop (cosméticos, cuidados pessoais, suplementos, fitness, cursos, produtividade, softwares, tech, moda e acessórios), combinando:

1. **Filtros determinísticos rápidos no cliente (`web/lib/match.ts`)**: pontuação transparente (0–100) por aderência de nicho, canal, maturidade, conversão estimada, risco de estorno/chargeback e score de compliance publicitário (CONAR / `#publi`).
2. **Explicação e briefing assistidos por IA no servidor (`web/lib/gemini.ts` + `web/app/api/explain/route.ts`)**: integração com a API gratuita do Gemini (`@google/genai`, modelo padrão `gemini-2.5-flash`), mantendo `GEMINI_API_KEY` exclusivamente no servidor.
3. **Fallback determinístico local (`web/lib/guide.ts`)**: caso `GEMINI_API_KEY` não esteja configurada, ocorra limite de requisições (`429`) ou erro temporário da API gratuita, o endpoint `/api/explain` responde automaticamente com uma análise determinística contextualizada sem interromper o fluxo de demonstração.

---

## Estrutura principal

| Caminho | Função |
|---|---|
| `pipeline/generate_creators.py` | Gerador em Python (stdlib) que valida e exporta `creators.json` (26 perfis simulados) e `campaigns.json` (6 campanhas de referência) |
| `web/public/data/creators.json` | Catálogo simulado de creators brasileiros |
| `web/public/data/campaigns.json` | Campanhas/produtos de referência da YouShop |
| `web/lib/types.ts` | Contratos TypeScript de creators, campanhas, filtros e `/api/explain` |
| `web/lib/match.ts` | Motor determinístico de filtragem e ranqueamento |
| `web/lib/guide.ts` | Gerador determinístico de briefing rápido, alertas e fallback local |
| `web/lib/gemini.ts` | Cliente server-only do Gemini (`gemini-2.5-flash`) com fallback automático |
| `web/app/api/explain/route.ts` | Rota `POST /api/explain` com validação estrita e lookup server-side |
| `web/components/` | `FilterPanel.tsx`, `ResultsBar.tsx`, `DoorCard.tsx`, `StartBox.tsx`, `ProjectBits.tsx` |
| `web/app/creators/[slug]/` | Página detalhada do creator com funil simulado e checklist de conformidade |

---

## Como rodar localmente

### 1. (Opcional) Regenerar o dataset simulado com Python
Requisitos: Python 3.11+ (sem dependências externas).

```bash
python3 pipeline/generate_creators.py
```

### 2. Rodar o front-end e a API Next.js (`web/`)
Requisitos: Node.js 20+ e npm.

```bash
cd web
cp ../.env.example .env.local
# Preencha GEMINI_API_KEY no arquivo .env.local (se ficar vazio, o fallback determinístico entra automaticamente)
npm install
npm test
npm run lint
npm run build
npm run dev
```

Acesse `http://localhost:3000`.

---

## Como subir para o GitHub e publicar na Vercel

### Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: MVP YouShop Creator Match"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/youshop-creator-match.git
git push -u origin main
```

> Verifique que nenhum arquivo `.env` ou `.env.local` foi versionado (ambos estão protegidos pelo `.gitignore`).

### Publicar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub.
2. Em **Configure Project**:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `web` (importante manter `web`, pois o `package.json` do Next.js está dentro dessa pasta).
3. Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY` = sua chave gratuita do Google AI Studio (`https://aistudio.google.com/apikey`)
   - `GEMINI_MODEL` = `gemini-2.5-flash` *(opcional; já é o padrão)*
4. Clique em **Deploy**.

---

## Limites, governança e cuidados éticos

- **Base simulada:** Todos os perfis de creators, métricas de cliques, vendas mensais, aprovação e taxas de conversão são dados sintéticos criados exclusivamente para demonstração do MVP.
- **Proteção da API Gemini:** a rota limita a 8 análises por IP a cada 15 minutos, por processo, quando a chave Gemini está configurada. Em deploys com múltiplas instâncias, use um limitador distribuído no proxy/plataforma para compartilhar esse limite.
- **Transparência publicitária (CONAR):** O sistema destaca o score de aderência a boas práticas de divulgação (`#publi`, parceria paga, clareza sobre planos e limitações) e exibe alertas específicos por categoria (cosméticos, suplementos e cursos digitais).
- **Prevenção de estornos e promessas irreais:** Campanhas sensíveis (como suplementos e cursos) bloqueiam ou sinalizam criadores com histórico simulado de linguagem agressiva ou alto risco de chargeback.
- **Revisão humana obrigatória:** A pontuação determinística e as recomendações do Gemini funcionam como apoio à decisão. A contratação, aprovação de roteiros e definição de metas comissionadas devem passar sempre por validação humana da equipe YouShop e da marca anunciante.
