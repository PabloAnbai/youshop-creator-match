// Contract types for YouShop Creator Match.

export type Niche =
  | "cosmeticos"
  | "cuidados-pessoais"
  | "suplementos"
  | "fitness"
  | "cursos"
  | "produtividade"
  | "softwares"
  | "tech"
  | "moda"
  | "acessorios";

export type Channel =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "blog"
  | "comunidades"
  | "trafego-pago";

export type Maturity = "iniciante" | "em-crescimento" | "recorrente";
export type Tier = "baixo" | "medio" | "alto";

export type Campaign = {
  id: string;
  name: string;
  brand: string;
  productType: "fisico" | "digital";
  niches: Niche[];
  preferredChannels: Channel[];
  recommendedMaturities: Maturity[];
  ticketBrl: number;
  commissionRate: number;
  goal: string;
  complianceAlert: string;
  description: string;
};

export type CreatorPerformance = {
  period: string;
  clicks: number;
  conversions: number;
  approvalRate: number;
  avgTicketBrl: number;
};

export type Creator = {
  id: string;
  slug: string;
  name: string;
  handle: string;
  city: string;
  followers: number;
  niches: Niche[];
  channels: Channel[];
  maturity: Maturity;
  engagementRate: number;
  estimatedConversionTier: Tier;
  avgConversionNote: string;
  avgMonthlySales: number;
  refundOrChargebackRisk: Tier;
  adComplianceScore: number;
  disclosureNotes: string;
  bestFormats: string[];
  summary: string;
  audienceProfile: string;
  commissionModel: string;
  recentPerformance: CreatorPerformance;
  briefingChecklist: string[];
  simulated: true;
};

export type ComplianceFloor = 0 | 75 | 85 | 92;

export type CampaignFilterProfile = {
  campaignId: string | null;
  niches: Niche[];
  channels: Channel[];
  maturities: Maturity[];
  minComplianceScore: ComplianceFloor;
  maxRefundRisk: "any" | "baixo" | "medio";
};

export type RankedCreator = {
  creator: Creator;
  score: number;
  reasons: string[];
  matchedNiches: Niche[];
  matchedChannels: Channel[];
};

export type ExplainRequest = {
  slug: string;
  campaignId?: string | null;
  profile: CampaignFilterProfile;
};

export type ExplainAnalysis = {
  whyMatch: string;
  suggestedAngle: string;
  briefingIdeas: string[];
  attentionAndEthics: string[];
};

export type ExplainResponse =
  | ({
      ok: true;
      source: "gemini" | "fallback";
      model: string;
      fallbackReason?: "missing_api_key" | "rate_limited" | "api_error" | "invalid_format";
    } & ExplainAnalysis)
  | {
      ok: false;
      error: "not_found" | "bad_request" | "rate_limited";
      message: string;
    };

export const NICHES: Niche[] = [
  "cosmeticos",
  "cuidados-pessoais",
  "suplementos",
  "fitness",
  "cursos",
  "produtividade",
  "softwares",
  "tech",
  "moda",
  "acessorios",
];

export const CHANNELS: Channel[] = [
  "instagram",
  "tiktok",
  "youtube",
  "blog",
  "comunidades",
  "trafego-pago",
];

export const MATURITIES: Maturity[] = ["iniciante", "em-crescimento", "recorrente"];
export const TIERS: Tier[] = ["baixo", "medio", "alto"];
export const COMPLIANCE_FLOORS: ComplianceFloor[] = [0, 75, 85, 92];
