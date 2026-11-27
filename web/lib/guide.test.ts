// Run with `npm test` (node:test; Node strips the types via test/ts-hooks.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { explainCreator, parseExplainJson } from "./gemini.ts";
import { buildDeterministicAnalysis, buildDeterministicBriefing, complianceAlertsFor } from "./guide.ts";
import { EMPTY_PROFILE } from "./profile-store.ts";
import type { Campaign, Creator } from "./types.ts";

const creator: Creator = {
  id: "cr-test",
  slug: "creator-teste",
  name: "Marina Teste",
  handle: "@marinateste",
  city: "São Paulo, SP",
  followers: 42000,
  niches: ["suplementos", "fitness"],
  channels: ["tiktok", "instagram"],
  maturity: "em-crescimento",
  engagementRate: 5.5,
  estimatedConversionTier: "alto",
  avgConversionNote: "Boa resposta em rotina pós-treino.",
  avgMonthlySales: 120,
  refundOrChargebackRisk: "medio",
  adComplianceScore: 72,
  disclosureNotes: "Precisa reforçar #publi nos primeiros 3 segundos.",
  bestFormats: ["POV rotina de treino"],
  summary: "Criadora focada em musculação prática.",
  audienceProfile: "Jovens adultos 20-34",
  commissionModel: "CPA 15%",
  recentPerformance: {
    period: "Últimos 90 dias (simulado)",
    clicks: 9000,
    conversions: 300,
    approvalRate: 91,
    avgTicketBrl: 98,
  },
  briefingChecklist: ["Enviar laudo do lote.", "Validar roteiro antes da gravação."],
  simulated: true,
};

const campaign: Campaign = {
  id: "creatina",
  name: "Creatina Pura 300g",
  brand: "UltraFit",
  productType: "fisico",
  niches: ["suplementos", "fitness"],
  preferredChannels: ["tiktok", "instagram"],
  recommendedMaturities: ["em-crescimento"],
  ticketBrl: 98,
  commissionRate: 15,
  goal: "Escalar vendas recorrentes",
  complianceAlert: "Não fazer alegações terapêuticas.",
  description: "Suplemento puro",
};

test("complianceAlertsFor flags low compliance, refund risk, and campaign alert", () => {
  const alerts = complianceAlertsFor(creator, campaign);
  assert.equal(alerts.length, 3);
  assert.match(alerts[0], /72\/100/);
  assert.match(alerts[1], /Risco medio/);
  assert.match(alerts[2], /Creatina Pura/);
});

test("buildDeterministicBriefing and buildDeterministicAnalysis produce structured pt-BR output", () => {
  const briefing = buildDeterministicBriefing(creator, EMPTY_PROFILE, campaign);
  assert.ok(briefing.steps.length >= 3);
  assert.match(briefing.steps[0], /Creatina Pura 300g/);

  const analysis = buildDeterministicAnalysis(creator, EMPTY_PROFILE, campaign);
  assert.match(analysis.whyMatch, /Marina Teste/);
  assert.match(analysis.suggestedAngle, /POV rotina de treino/);
  assert.ok(analysis.attentionAndEthics.some((a) => /dados simulados/i.test(a)));
});

test("parseExplainJson extracts valid JSON even with surrounding prose", () => {
  const raw = `Aqui está a análise:\n\`\`\`json\n{
    "whyMatch": "Ótimo fit de nicho e canal.",
    "suggestedAngle": "Mostrar uso diário pós-treino.",
    "briefingIdeas": ["Enviar amostra", "Usar cupom rastreável"],
    "attentionAndEthics": ["Exigir #publi", "Dados simulados exigem revisão humana"]
  }\n\`\`\``;
  const parsed = parseExplainJson(raw);
  assert.ok(parsed);
  assert.equal(parsed.whyMatch, "Ótimo fit de nicho e canal.");
  assert.equal(parsed.briefingIdeas.length, 2);
  assert.equal(parseExplainJson("texto sem json"), null);
});

test("explainCreator falls back deterministically when GEMINI_API_KEY is absent", async () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const res = await explainCreator(creator, EMPTY_PROFILE, campaign);
    assert.equal(res.ok, true);
    assert.equal(res.source, "fallback");
    assert.equal(res.fallbackReason, "missing_api_key");
    assert.ok(res.whyMatch.length > 20);
    assert.ok(res.attentionAndEthics.length >= 2);
  } finally {
    if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
  }
});
