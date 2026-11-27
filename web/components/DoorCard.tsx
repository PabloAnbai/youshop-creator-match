"use client";
// Creator card in the ranked results feed: deterministic score, metrics, formats, and AI explain trigger.
import Link from "next/link";
import { CHANNEL_LABELS, NICHE_LABELS } from "@/lib/labels";
import type { Campaign, CampaignFilterProfile, RankedCreator } from "@/lib/types";
import {
  BigNumbers,
  ComplianceBadge,
  fmtFollowers,
  ProfileBand,
  RecentActivity,
} from "./ProjectBits";
import StartBox from "./StartBox";

export default function DoorCard({
  ranked,
  profile,
  campaign,
}: {
  ranked: RankedCreator;
  profile: CampaignFilterProfile;
  campaign?: Campaign | null;
}) {
  const { creator, matchedNiches, matchedChannels } = ranked;

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-card">
      <ProfileBand ranked={ranked} />

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <Link
            href={`/creators/${creator.slug}`}
            className="group min-w-0"
          >
            <h3 className="break-words text-xl font-semibold leading-tight group-hover:underline">
              {creator.name}
            </h3>
            <span className="text-xs text-muted">
              {creator.handle} · {creator.city} · {fmtFollowers(creator.followers)} seguidores
            </span>
          </Link>
          <ComplianceBadge creator={creator} />
        </header>

        <p className="max-w-prose text-[15px] leading-relaxed">{creator.summary}</p>

        <BigNumbers creator={creator} />
        <RecentActivity creator={creator} compact />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">Nichos:</span>
          {creator.niches.map((n) => {
            const active = matchedNiches.includes(n);
            return (
              <span
                key={n}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "border border-line text-foreground/80"
                }`}
              >
                {NICHE_LABELS[n]}
              </span>
            );
          })}
          <span className="mx-1 text-xs text-muted">· Canais:</span>
          {creator.channels.map((ch) => {
            const active = matchedChannels.includes(ch);
            return (
              <span
                key={ch}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  active
                    ? "bg-foreground text-background"
                    : "border border-line text-muted"
                }`}
              >
                {CHANNEL_LABELS[ch]}
              </span>
            );
          })}
        </div>

        <p className="text-xs text-muted">
          <span className="font-medium text-foreground/80">Formatos fortes:</span>{" "}
          {creator.bestFormats.join(" · ")}
        </p>

        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <StartBox creator={creator} profile={profile} campaign={campaign} />
          <Link
            href={`/creators/${creator.slug}`}
            className="self-start text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver ficha completa, funil simulado e checklist de conformidade →
          </Link>
        </div>
      </div>
    </article>
  );
}
