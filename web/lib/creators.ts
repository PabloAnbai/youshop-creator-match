// Server-side catalog lookup: bundled directly so serverless routes never rely on runtime file fetches.
import campaignsData from "@/public/data/campaigns.json";
import creatorsData from "@/public/data/creators.json";
import type { Campaign, Creator } from "./types";

const creators = creatorsData as Creator[];
const campaigns = campaignsData as Campaign[];

const creatorBySlug = new Map(creators.map((c) => [c.slug.toLowerCase(), c]));
const campaignById = new Map(campaigns.map((c) => [c.id.toLowerCase(), c]));

export function getCreator(slug: string): Creator | undefined {
  return creatorBySlug.get(slug.toLowerCase());
}

export function getCampaign(id: string | null | undefined): Campaign | undefined {
  if (typeof id !== "string" || !id) return undefined;
  return campaignById.get(id.toLowerCase());
}
