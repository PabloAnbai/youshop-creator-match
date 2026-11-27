// Deterministic creator filtering and ranking for YouShop Creator Match.
import { CHANNEL_LABELS, NICHE_LABELS } from "./labels";
import type {
  Campaign,
  CampaignFilterProfile,
  Channel,
  Creator,
  Niche,
  RankedCreator,
  Tier,
} from "./types";

const CONVERSION_SCORE: Record<Tier, number> = {
  alto: 9,
  medio: 6,
  baixo: 3,
};

const REFUND_SAFETY_SCORE: Record<Tier, number> = {
  baixo: 6,
  medio: 3,
  alto: 0,
};

function allowsRefundRisk(risk: Tier, maxRisk: CampaignFilterProfile["maxRefundRisk"]): boolean {
  if (maxRisk === "any") return true;
  if (maxRisk === "baixo") return risk === "baixo";
  return risk === "baixo" || risk === "medio";
}

export function rankCreators(
  creators: Creator[],
  profile: CampaignFilterProfile,
  campaign?: Campaign | null,
): RankedCreator[] {
  const targetNiches: Niche[] =
    profile.niches.length > 0 ? profile.niches : campaign?.niches ?? [];
  const targetChannels: Channel[] =
    profile.channels.length > 0 ? profile.channels : campaign?.preferredChannels ?? [];
  const targetMaturities =
    profile.maturities.length > 0
      ? profile.maturities
      : campaign?.recommendedMaturities ?? [];

  const ranked: RankedCreator[] = [];

  for (const creator of creators) {
    if (creator.adComplianceScore < profile.minComplianceScore) continue;
    if (!allowsRefundRisk(creator.refundOrChargebackRisk, profile.maxRefundRisk)) continue;
    if (profile.maturities.length > 0 && !profile.maturities.includes(creator.maturity)) continue;

    const matchedNiches = creator.niches.filter((n) => targetNiches.includes(n));
    if (targetNiches.length > 0 && matchedNiches.length === 0) continue;

    const matchedChannels = creator.channels.filter((ch) => targetChannels.includes(ch));
    if (profile.channels.length > 0 && matchedChannels.length === 0) continue;

    // 1. Niche alignment (up to 40 pts)
    const nicheScore =
      targetNiches.length > 0
        ? Math.round((matchedNiches.length / Math.min(targetNiches.length, 2)) * 34) + 6
        : 28;
    const clampedNiche = Math.min(40, nicheScore);

    // 2. Channel alignment (up to 20 pts)
    const channelScore =
      targetChannels.length > 0
        ? Math.round((matchedChannels.length / Math.min(targetChannels.length, 2)) * 20)
        : 14;
    const clampedChannel = Math.min(20, channelScore);

    // 3. Compliance & refund safety (up to 20 pts)
    const compliancePts = Math.round((creator.adComplianceScore / 100) * 14);
    const safetyPts = REFUND_SAFETY_SCORE[creator.refundOrChargebackRisk];

    // 4. Conversion & engagement (up to 15 pts)
    const conversionPts = CONVERSION_SCORE[creator.estimatedConversionTier];
    const engagementPts = Math.min(6, Math.round(creator.engagementRate));

    // 5. Maturity alignment (up to 5 pts)
    const maturityPts =
      targetMaturities.length === 0
        ? 3
        : targetMaturities.includes(creator.maturity)
          ? 5
          : 1;

    const score = Math.max(
      0,
      Math.min(
        100,
        clampedNiche + clampedChannel + compliancePts + safetyPts + conversionPts + engagementPts + maturityPts,
      ),
    );

    const reasons: string[] = [];
    if (matchedNiches.length > 0) {
      reasons.push(`atua em ${matchedNiches.map((n) => NICHE_LABELS[n]).join(" e ")}`);
    }
    if (matchedChannels.length > 0) {
      reasons.push(`forte em ${matchedChannels.map((c) => CHANNEL_LABELS[c]).join(" + ")}`);
    }
    if (creator.adComplianceScore >= 90 && creator.refundOrChargebackRisk === "baixo") {
      reasons.push("alta aderência a transparência e baixo risco de estorno");
    } else if (creator.adComplianceScore < 75 || creator.refundOrChargebackRisk === "alto") {
      reasons.push("requer revisão prévia de copy e regras de divulgação");
    }

    ranked.push({
      creator,
      score,
      reasons,
      matchedNiches,
      matchedChannels,
    });
  }

  return ranked.sort(
    (a, b) =>
      b.score - a.score ||
      b.creator.adComplianceScore - a.creator.adComplianceScore ||
      b.creator.avgMonthlySales - a.creator.avgMonthlySales ||
      b.creator.engagementRate - a.creator.engagementRate,
  );
}
