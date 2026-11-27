import {
  CHANNELS,
  COMPLIANCE_FLOORS,
  MATURITIES,
  NICHES,
  type CampaignFilterProfile,
  type Channel,
  type ComplianceFloor,
  type Maturity,
  type Niche,
} from "./types";

const KEY = "youshop:filter-profile";

export const EMPTY_PROFILE: CampaignFilterProfile = {
  campaignId: null,
  niches: [],
  channels: [],
  maturities: [],
  minComplianceScore: 0,
  maxRefundRisk: "any",
};

export function loadProfile(): CampaignFilterProfile {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (!raw || typeof raw !== "object") return EMPTY_PROFILE;
    return {
      campaignId: typeof raw.campaignId === "string" ? raw.campaignId : null,
      niches: Array.isArray(raw.niches) ? raw.niches.filter((n: Niche) => NICHES.includes(n)) : [],
      channels: Array.isArray(raw.channels) ? raw.channels.filter((c: Channel) => CHANNELS.includes(c)) : [],
      maturities: Array.isArray(raw.maturities)
        ? raw.maturities.filter((m: Maturity) => MATURITIES.includes(m))
        : [],
      minComplianceScore: COMPLIANCE_FLOORS.includes(raw.minComplianceScore as ComplianceFloor)
        ? (raw.minComplianceScore as ComplianceFloor)
        : 0,
      maxRefundRisk:
        raw.maxRefundRisk === "baixo" || raw.maxRefundRisk === "medio" ? raw.maxRefundRisk : "any",
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile: CampaignFilterProfile) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(profile));
  } catch {}
}
