"use client";
// Briefing rápido (determinístico local) + análise assistida por IA via POST /api/explain (Gemini + fallback).
import { useState } from "react";
import { buildDeterministicBriefing } from "@/lib/guide";
import type {
  Campaign,
  CampaignFilterProfile,
  Creator,
  ExplainResponse,
} from "@/lib/types";

type ExplainSuccess = Extract<ExplainResponse, { ok: true }>;

const FALLBACK_LABELS: Record<NonNullable<ExplainSuccess["fallbackReason"]>, string> = {
  missing_api_key: "Análise determinística local (chave da API não configurada no servidor)",
  rate_limited: "Análise determinística local (limite temporário 429 da API gratuita)",
  api_error: "Análise determinística local (API Gemini temporariamente indisponível)",
  invalid_format: "Análise determinística local (resposta fora do padrão esperado)",
};

export default function StartBox({
  creator,
  profile,
  campaign,
  startOpen = false,
}: {
  creator: Creator;
  profile: CampaignFilterProfile;
  campaign?: Campaign | null;
  startOpen?: boolean;
}) {
  const [briefingOpen, setBriefingOpen] = useState(startOpen);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiState, setAiState] = useState<{ key: string; data: ExplainSuccess } | null>(null);

  const contextKey = `${creator.slug}:${campaign?.id ?? "free"}:${profile.niches.join(",")}:${profile.channels.join(",")}`;
  const currentAi = aiState?.key === contextKey ? aiState.data : null;

  async function runAiExplain() {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: creator.slug,
          campaignId: campaign?.id ?? profile.campaignId,
          profile,
        }),
      });
      const json = (await res.json()) as ExplainResponse;
      if (!json.ok) {
        setAiError(json.message);
        return;
      }
      setAiState({ key: contextKey, data: json });
    } catch {
      setAiError("Não foi possível consultar /api/explain agora. Tente novamente.");
    } finally {
      setLoadingAi(false);
    }
  }

  const briefing = buildDeterministicBriefing(creator, profile, campaign);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setBriefingOpen((v) => !v)}
          className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {briefingOpen ? "Ocultar briefing rápido" : "Briefing rápido"}
        </button>

        <button
          type="button"
          disabled={loadingAi}
          onClick={runAiExplain}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-85 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          {loadingAi
            ? "Analisando match com IA…"
            : currentAi
              ? "Atualizar análise com IA"
              : "Explicar match com IA (Gemini)"}
        </button>
      </div>

      {briefingOpen && (
        <div className="space-y-3 rounded-xl border border-line bg-background/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Checklist determinístico de briefing
            </span>
            <span className="text-xs text-muted">{creator.commissionModel}</span>
          </div>
          <ol className="space-y-2">
            {briefing.steps.map((step, i) => (
              <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {briefing.alerts.map((alert) => (
            <p
              key={alert}
              className="rounded-md bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-200"
            >
              {alert}
            </p>
          ))}
        </div>
      )}

      {aiError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {aiError}
        </p>
      )}

      {currentAi && (
        <div className="space-y-3 rounded-xl border border-emerald-600/30 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {currentAi.source === "gemini"
                ? `Recomendação via Gemini (${currentAi.model})`
                : FALLBACK_LABELS[currentAi.fallbackReason ?? "missing_api_key"]}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Por que faz match
            </h4>
            <p className="text-sm leading-relaxed">{currentAi.whyMatch}</p>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ângulo de divulgação sugerido
            </h4>
            <p className="text-sm leading-relaxed">{currentAi.suggestedAngle}</p>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ideias de briefing e mensuração
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {currentAi.briefingIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5 rounded-lg bg-amber-500/10 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
              Pontos de atenção, limites e cuidados éticos
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
              {currentAi.attentionAndEthics.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
