// Run with `npm test` (node:test; Node strips the types via test/ts-hooks.mjs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { rankCreators } from "./match.ts";
import { EMPTY_PROFILE } from "./profile-store.ts";
import type { Campaign, CampaignFilterProfile, Creator } from "./types.ts";

const makeCreator = (slug: string, over: Partial<Creator> = {}): Creator => ({
  id: slug,
  slug,
  name: slug,
  handle: `@${slug}`,
  city: "São Paulo, SP",
  followers: 50_000,
  niches: ["cosmeticos"],
  channels: ["instagram"],
  maturity: "em-crescimento",
  engagementRate: 5.0,
  estimatedConversionTier: "medio",
  avgConversionNote: "Conversão estável",
  avgMonthlySales: 100,
  refundOrChargebackRisk: "baixo",
  adComplianceScore: 90,
  disclosureNotes: "Usa #publi corretamente",
  bestFormats: ["Reels tutorial"],
  summary: "Creator simulado",
  audienceProfile: "Público geral",
  commissionModel: "CPA 18%",
  recentPerformance: {
    period: "Últimos 90 dias (simulado)",
    clicks: 5000,
    conversions: 150,
    approvalRate: 96,
    avgTicketBrl: 120,
  },
  briefingChecklist: ["Checklist 1"],
  simulated: true,
  ...over,
});

const makeProfile = (over: Partial<CampaignFilterProfile> = {}): CampaignFilterProfile => ({
  ...EMPTY_PROFILE,
  ...over,
});

const serumCampaign: Campaign = {
  id: "serum",
  name: "Sérum Vitamina C",
  brand: "GlowLab",
  productType: "fisico",
  niches: ["cosmeticos", "cuidados-pessoais"],
  preferredChannels: ["instagram", "tiktok"],
  recommendedMaturities: ["em-crescimento", "recorrente"],
  ticketBrl: 119,
  commissionRate: 18,
  goal: "Gerar demonstrações visuais",
  complianceAlert: "Proibido prometer cura clínica",
  description: "Skincare acessível",
};

test("compliance floor and refund risk exclude non-conforming creators", () => {
  const list = [
    makeCreator("safe", { adComplianceScore: 94, refundOrChargebackRisk: "baixo" }),
    makeCreator("mid", { adComplianceScore: 80, refundOrChargebackRisk: "medio" }),
    makeCreator("risky", { adComplianceScore: 62, refundOrChargebackRisk: "alto" }),
  ];

  assert.deepEqual(
    rankCreators(list, makeProfile({ minComplianceScore: 85 })).map((r) => r.creator.slug),
    ["safe"],
  );
  assert.deepEqual(
    rankCreators(list, makeProfile({ maxRefundRisk: "medio" })).map((r) => r.creator.slug),
    ["safe", "mid"],
  );
  assert.deepEqual(
    rankCreators(list, makeProfile({ maxRefundRisk: "baixo" })).map((r) => r.creator.slug),
    ["safe"],
  );
});

test("campaign context filters to matching niches when profile niches are empty", () => {
  const list = [
    makeCreator("beauty", { niches: ["cosmeticos"], channels: ["instagram"] }),
    makeCreator("saas", { niches: ["softwares"], channels: ["youtube"] }),
  ];

  const ranked = rankCreators(list, makeProfile({ campaignId: "serum" }), serumCampaign);
  assert.deepEqual(
    ranked.map((r) => r.creator.slug),
    ["beauty"],
  );
  assert.deepEqual(ranked[0].matchedNiches, ["cosmeticos"]);
});

test("explicit niches, channels, and maturities filter deterministically", () => {
  const list = [
    makeCreator("ig-init", {
      niches: ["suplementos"],
      channels: ["instagram"],
      maturity: "iniciante",
    }),
    makeCreator("tt-rec", {
      niches: ["suplementos", "fitness"],
      channels: ["tiktok", "instagram"],
      maturity: "recorrente",
    }),
  ];

  const ranked = rankCreators(
    list,
    makeProfile({ niches: ["suplementos"], channels: ["tiktok"], maturities: ["recorrente"] }),
  );
  assert.deepEqual(
    ranked.map((r) => r.creator.slug),
    ["tt-rec"],
  );
});

test("ranking rewards niche + channel alignment, compliance, and conversion", () => {
  const list = [
    makeCreator("partial", {
      niches: ["cosmeticos"],
      channels: ["blog"],
      adComplianceScore: 76,
      estimatedConversionTier: "baixo",
      avgMonthlySales: 40,
    }),
    makeCreator("strong", {
      niches: ["cosmeticos", "cuidados-pessoais"],
      channels: ["instagram", "tiktok"],
      adComplianceScore: 96,
      estimatedConversionTier: "alto",
      avgMonthlySales: 200,
    }),
  ];

  const ranked = rankCreators(list, makeProfile({ campaignId: "serum" }), serumCampaign);
  assert.equal(ranked[0].creator.slug, "strong");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].score <= 100);
});
