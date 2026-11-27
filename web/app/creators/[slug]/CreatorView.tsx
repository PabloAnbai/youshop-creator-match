"use client";
// Detailed creator page: metrics, compliance readiness, funnel performance, deterministic briefing, and Gemini match analysis.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BigNumbers,
  ComplianceBadge,
  ComplianceChecks,
  fmtFollowers,
  ProfileBand,
  RecentActivity,
} from "@/components/ProjectBits";
import StartBox from "@/components/StartBox";
import { CHANNEL_LABELS, NICHE_LABELS, REFUND_RISK_LABELS } from "@/lib/labels";
import { rankCreators } from "@/lib/match";
import { EMPTY_PROFILE, loadProfile, saveProfile } from "@/lib/profile-store";
import type { Campaign, CampaignFilterProfile, Creator } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function CreatorView() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "").toLowerCase();
  const [creator, setCreator] = useState<Creator | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [profile, setProfile] = useState<CampaignFilterProfile>(EMPTY_PROFILE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage only exists after mount; reading it here keeps the server HTML identical
    setProfile(loadProfile());
    Promise.all([
      fetch("/data/creators.json").then((r) => r.json()),
      fetch("/data/campaigns.json").then((r) => r.json()),
    ])
      .then(([allCreators, allCampaigns]: [Creator[], Campaign[]]) => {
        setCreator(allCreators.find((c) => c.slug.toLowerCase() === slug) ?? null);
        setCampaigns(allCampaigns);
      })
      .catch(() => setCreator(null));
  }, [slug]);

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.id === profile.campaignId) ?? null,
    [campaigns, profile.campaignId],
  );

  const ranked = useMemo(() => {
    if (!creator) return null;
    const unconstrained: CampaignFilterProfile = {
      ...EMPTY_PROFILE,
      campaignId: profile.campaignId,
    };
    const [result] = rankCreators([creator], profile, activeCampaign);
    if (result) return result;
    const [fallbackResult] = rankCreators([creator], unconstrained, null);
    return fallbackResult ?? null;
  }, [creator, profile, activeCampaign]);

  if (creator === undefined) {
    return <main className="mx-auto max-w-3xl px-4 py-8 text-muted">Carregando ficha do creator…</main>;
  }

  if (creator === null || !ranked) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 px-4 py-8">
        <p>Creator &quot;{slug}&quot; não encontrado no catálogo simulado do YouShop Creator Match.</p>
        <Link href="/" className="underline">
          ← Voltar para a curadoria
        </Link>
      </main>
    );
  }

  const risk = REFUND_RISK_LABELS[creator.refundOrChargebackRisk];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted hover:text-foreground hover:underline">
          ← Voltar para os matches
        </Link>
        <span className="rounded-full border border-line bg-card px-2.5 py-0.5 text-xs text-muted">
          Perfil simulado · YouShop 2027
        </span>
      </div>

      <header className="overflow-hidden rounded-xl border border-line bg-card">
        <ProfileBand ranked={ranked} />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight">
                {creator.name}
              </h1>
              <p className="text-sm text-muted">
                {creator.handle} · {creator.city} · {fmtFollowers(creator.followers)} seguidores
              </p>
            </div>
            <ComplianceBadge creator={creator} />
          </div>

          <p className="text-base leading-relaxed sm:text-lg">{creator.summary}</p>
          <p className="text-sm text-muted">
            <strong className="font-medium text-foreground">Público predominante:</strong>{" "}
            {creator.audienceProfile}
          </p>

          <BigNumbers creator={creator} full />
        </div>
      </header>

      <Section title="Contextualizar com campanha e analisar com IA">
        <div className="space-y-2">
          <label htmlFor="detail-campaign" className="block text-xs font-medium text-muted">
            Campanha de referência para o briefing e a explicação do Gemini
          </label>
          <select
            id="detail-campaign"
            value={profile.campaignId ?? ""}
            onChange={(e) => {
              const next = {
                ...profile,
                campaignId: e.target.value ? e.target.value : null,
              };
              setProfile(next);
              saveProfile(next);
            }}
            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Exploração livre (sem campanha fixa)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.brand} ({c.commissionRate}% comissão)
              </option>
            ))}
          </select>
        </div>

        <StartBox creator={creator} profile={profile} campaign={activeCampaign} startOpen />
      </Section>

      <Section title="Nichos, canais e formatos com melhor resposta">
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">Nichos:</span>
            {creator.niches.map((n) => (
              <span key={n} className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                {NICHE_LABELS[n]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">Canais:</span>
            {creator.channels.map((ch) => (
              <span key={ch} className="rounded-full border border-line px-2.5 py-0.5 text-xs">
                {CHANNEL_LABELS[ch]}
              </span>
            ))}
          </div>
          <p className="text-muted">
            <strong className="font-medium text-foreground">Observação de conversão:</strong>{" "}
            {creator.avgConversionNote}
          </p>
          <p className="text-muted">
            <strong className="font-medium text-foreground">Comissionamento sugerido:</strong>{" "}
            {creator.commissionModel}
          </p>
          <div>
            <p className="mb-1.5 font-medium text-foreground">Formatos recomendados:</p>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {creator.bestFormats.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Transparência publicitária e risco operacional">
        <p className={`text-sm font-medium ${risk.className}`}>{risk.label}</p>
        <ComplianceChecks creator={creator} />
      </Section>

      <Section title="Funil simulado recente">
        <RecentActivity creator={creator} />
      </Section>
    </main>
  );
}
