// Deterministic creator briefing, compliance warnings, and local fallback analysis.
import { CHANNEL_LABELS, CONVERSION_LABELS, MATURITY_LABELS, NICHE_LABELS } from "./labels";
import type { Campaign, CampaignFilterProfile, Creator, ExplainAnalysis } from "./types";

export function complianceAlertsFor(creator: Creator, campaign?: Campaign | null): string[] {
  const alerts: string[] = [];
  if (creator.adComplianceScore < 80) {
    alerts.push(
      `Atenção ao compliance (${creator.adComplianceScore}/100): ${creator.disclosureNotes} Exija aprovação prévia de roteiro e #publi visível.`,
    );
  }
  if (creator.refundOrChargebackRisk !== "baixo") {
    alerts.push(
      `Risco ${creator.refundOrChargebackRisk} de estorno/chargeback: alinhe expectativas reais sobre entrega, resultados e prazo de garantia.`,
    );
  }
  if (campaign?.complianceAlert) {
    alerts.push(`Regra da campanha (${campaign.name}): ${campaign.complianceAlert}`);
  }
  return alerts;
}

export function buildDeterministicBriefing(
  creator: Creator,
  profile: CampaignFilterProfile,
  campaign?: Campaign | null,
): { steps: string[]; alerts: string[] } {
  const selectedNiches = (profile.niches.length ? profile.niches : campaign?.niches ?? creator.niches)
    .filter((n) => creator.niches.includes(n))
    .map((n) => NICHE_LABELS[n]);

  const firstNiche = selectedNiches[0] ?? NICHE_LABELS[creator.niches[0]];
  const leadChannel = CHANNEL_LABELS[
    creator.channels.find((c) => (profile.channels.length ? profile.channels.includes(c) : true)) ??
      creator.channels[0]
  ];

  const steps: string[] = [
    campaign
      ? `Contextualizar a oferta de ${campaign.name} (${campaign.brand}, comissão de ${campaign.commissionRate}%) para o nicho de ${firstNiche}.`
      : `Validar enquadramento da oferta no nicho de ${firstNiche} com foco em ${leadChannel}.`,
    `Priorizar o formato "${creator.bestFormats[0]}" com link rastreável e cupom exclusivo para mensurar vendas.`,
    ...creator.briefingChecklist.slice(0, 2),
  ];

  return {
    steps,
    alerts: complianceAlertsFor(creator, campaign),
  };
}

export function buildDeterministicAnalysis(
  creator: Creator,
  profile: CampaignFilterProfile,
  campaign?: Campaign | null,
): ExplainAnalysis {
  const nicheNames = creator.niches.map((n) => NICHE_LABELS[n]).join(", ");
  const channelNames = creator.channels.map((c) => CHANNEL_LABELS[c]).join(", ");
  const maturityLabel = MATURITY_LABELS[creator.maturity].label.toLowerCase();
  const conversionLabel = CONVERSION_LABELS[creator.estimatedConversionTier].toLowerCase();

  const campaignPart = campaign
    ? `Para a campanha "${campaign.name}" (${campaign.brand}), o perfil converge com os nichos ${campaign.niches
        .map((n) => NICHE_LABELS[n])
        .join(" / ")} e a meta de ${campaign.goal.toLowerCase()}`
    : `No contexto dos filtros selecionados, o perfil combina cobertura em ${nicheNames} com presença ativa em ${channelNames}.`;

  const whyMatch = `${creator.name} (${creator.handle}) é um ${maturityLabel} com ${creator.engagementRate
    .toFixed(1)
    .replace(".", ",")}% de engajamento e ${conversionLabel} (~${creator.avgMonthlySales} vendas/mês estimadas). ${campaignPart} ${creator.avgConversionNote}`;

  const suggestedAngle = `Explorar "${creator.bestFormats[0]}" em ${channelNames.split(", ")[0]}, conectando a dor real do público (${creator.audienceProfile}) com demonstração prática de uso e link rastreável com código exclusivo.`;

  const briefingIdeas = buildDeterministicBriefing(creator, profile, campaign).steps;

  const attentionAndEthics = [
    ...complianceAlertsFor(creator, campaign),
    `Transparência publicitária (CONAR): ${creator.disclosureNotes}`,
    "Limites do MVP: métricas e histórico exibidos são dados simulados para demonstração; a aprovação final da parceria requer revisão humana e validação contratual.",
  ];

  return {
    whyMatch,
    suggestedAngle,
    briefingIdeas,
    attentionAndEthics,
  };
}
