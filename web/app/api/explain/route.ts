// POST /api/explain — server-only endpoint combining creator + campaign context via Gemini (with deterministic fallback).
import { getCampaign, getCreator } from "@/lib/creators";
import { explainCreator } from "@/lib/gemini";
import {
  CHANNELS,
  COMPLIANCE_FLOORS,
  MATURITIES,
  NICHES,
  type CampaignFilterProfile,
  type ExplainRequest,
  type ExplainResponse,
} from "@/lib/types";
import { createRateLimiter } from "@/lib/rate-limit";

const EXPLAIN_LIMIT = 8;
const EXPLAIN_WINDOW_MS = 15 * 60 * 1000;
const consumeExplainLimit = createRateLimiter(EXPLAIN_LIMIT, EXPLAIN_WINDOW_MS);

function fail(
  status: number,
  error: Extract<ExplainResponse, { ok: false }>["error"],
  message: string,
  headers?: HeadersInit,
) {
  return Response.json({ ok: false, error, message } satisfies ExplainResponse, {
    status,
    headers,
  });
}

function isValidProfile(p: unknown): p is CampaignFilterProfile {
  if (!p || typeof p !== "object") return false;
  const r = p as CampaignFilterProfile;
  return (
    (r.campaignId === null || r.campaignId === undefined || typeof r.campaignId === "string") &&
    Array.isArray(r.niches) &&
    r.niches.every((n) => NICHES.includes(n)) &&
    Array.isArray(r.channels) &&
    r.channels.every((c) => CHANNELS.includes(c)) &&
    Array.isArray(r.maturities) &&
    r.maturities.every((m) => MATURITIES.includes(m)) &&
    COMPLIANCE_FLOORS.includes(r.minComplianceScore) &&
    (r.maxRefundRisk === "any" || r.maxRefundRisk === "baixo" || r.maxRefundRisk === "medio")
  );
}

function isRequest(b: unknown): b is ExplainRequest {
  if (!b || typeof b !== "object") return false;
  const r = b as ExplainRequest;
  return (
    typeof r.slug === "string" &&
    r.slug.trim().length > 0 &&
    (r.campaignId === undefined || r.campaignId === null || typeof r.campaignId === "string") &&
    isValidProfile(r.profile)
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isRequest(body)) {
    return fail(400, "bad_request", "Envie { slug, campaignId?, profile } válidos.");
  }

  const creator = getCreator(body.slug.trim());
  if (!creator) {
    return fail(404, "not_found", `Creator "${body.slug}" não encontrado no catálogo simulado.`);
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    const clientKey =
      request.headers.get("x-real-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rateLimit = consumeExplainLimit(clientKey);
    if (!rateLimit.allowed) {
      return fail(
        429,
        "rate_limited",
        "Limite de análises atingido. Tente novamente após alguns minutos.",
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }
  }

  const campaign = getCampaign(body.campaignId ?? body.profile.campaignId);
  const explanation = await explainCreator(creator, body.profile, campaign);

  return Response.json(explanation satisfies ExplainResponse, { status: 200 });
}
