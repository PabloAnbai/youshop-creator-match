"use client";
// Left-column deterministic filter panel for YouShop campaigns, niches, channels, maturity, and compliance.
import {
  CHANNEL_LABELS,
  COMPLIANCE_FLOOR_LABELS,
  MATURITY_LABELS,
  NICHE_LABELS,
} from "@/lib/labels";
import { EMPTY_PROFILE } from "@/lib/profile-store";
import {
  CHANNELS,
  COMPLIANCE_FLOORS,
  MATURITIES,
  NICHES,
  type Campaign,
  type CampaignFilterProfile,
  type ComplianceFloor,
} from "@/lib/types";

function Chip({
  on,
  onClick,
  children,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 ${
        on
          ? "bg-emerald-600 text-white"
          : "border border-line bg-card text-foreground/85 hover:border-foreground/30"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

export default function FilterPanel({
  campaigns,
  profile,
  onChange,
}: {
  campaigns: Campaign[];
  profile: CampaignFilterProfile;
  onChange: (p: CampaignFilterProfile) => void;
}) {
  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const activeCampaign = campaigns.find((c) => c.id === profile.campaignId) ?? null;
  const hasFilters =
    profile.campaignId !== null ||
    profile.niches.length > 0 ||
    profile.channels.length > 0 ||
    profile.maturities.length > 0 ||
    profile.minComplianceScore > 0 ||
    profile.maxRefundRisk !== "any";

  return (
    <section aria-label="Critérios da campanha" className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="campaign-select" className="text-sm font-semibold">
            Campanha de referência
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_PROFILE)}
              className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
            >
              Limpar tudo
            </button>
          )}
        </div>
        <select
          id="campaign-select"
          value={profile.campaignId ?? ""}
          onChange={(e) =>
            onChange({
              ...profile,
              campaignId: e.target.value ? e.target.value : null,
            })
          }
          className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <option value="">Exploração livre (todas as campanhas)</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.commissionRate}% comissão
            </option>
          ))}
        </select>

        {activeCampaign && (
          <div className="space-y-1.5 rounded-xl border border-emerald-600/25 bg-emerald-500/5 p-3 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
              <span>{activeCampaign.brand}</span>
              <span className="tabular-nums">
                R$ {activeCampaign.ticketBrl} · {activeCampaign.commissionRate}%
              </span>
            </div>
            <p className="text-foreground/80">{activeCampaign.goal}</p>
            <p className="text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Atenção:</span> {activeCampaign.complianceAlert}
            </p>
          </div>
        )}
      </div>

      <Group label="Nichos e categorias">
        {NICHES.map((n) => (
          <Chip
            key={n}
            on={profile.niches.includes(n)}
            onClick={() => onChange({ ...profile, niches: toggle(profile.niches, n) })}
          >
            {NICHE_LABELS[n]}
          </Chip>
        ))}
      </Group>

      <Group label="Canais prioritários">
        {CHANNELS.map((c) => (
          <Chip
            key={c}
            on={profile.channels.includes(c)}
            onClick={() => onChange({ ...profile, channels: toggle(profile.channels, c) })}
          >
            {CHANNEL_LABELS[c]}
          </Chip>
        ))}
      </Group>

      <Group label="Maturidade do creator">
        {MATURITIES.map((m) => (
          <Chip
            key={m}
            title={MATURITY_LABELS[m].hint}
            on={profile.maturities.includes(m)}
            onClick={() => onChange({ ...profile, maturities: toggle(profile.maturities, m) })}
          >
            {MATURITY_LABELS[m].label}
          </Chip>
        ))}
      </Group>

      <div className="space-y-3 border-t border-line pt-4">
        <div className="space-y-1.5">
          <label htmlFor="compliance-floor" className="block text-sm font-semibold">
            Compliance publicitário mínimo
          </label>
          <select
            id="compliance-floor"
            value={profile.minComplianceScore}
            onChange={(e) =>
              onChange({
                ...profile,
                minComplianceScore: Number(e.target.value) as ComplianceFloor,
              })
            }
            className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {COMPLIANCE_FLOORS.map((score) => (
              <option key={score} value={score}>
                {COMPLIANCE_FLOOR_LABELS[score]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold">Risco de estorno / chargeback</span>
          <div className="flex w-full rounded-full border border-line bg-card p-0.5">
            {(
              [
                ["any", "Todos"],
                ["medio", "Até médio"],
                ["baixo", "Só baixo"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={profile.maxRefundRisk === value}
                onClick={() => onChange({ ...profile, maxRefundRisk: value })}
                className={`flex-1 rounded-full px-2 py-1 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  profile.maxRefundRisk === value
                    ? "bg-foreground text-background"
                    : "text-foreground/75 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
