import type { CategoryDef } from "./types";

export const WORLD_CATEGORIES: CategoryDef[] = [
  { slug: "technology-ai", name: "Technology & AI", region: "world", color: "#a78bfa" },
  { slug: "politics-government", name: "Politics & Government", region: "world", color: "#60a5fa" },
  { slug: "business-markets", name: "Business & Markets", region: "world", color: "#34d399" },
  { slug: "science-health", name: "Science & Health", region: "world", color: "#22d3ee" },
  { slug: "climate-environment", name: "Climate & Environment", region: "world", color: "#a3e635" },
  { slug: "international-conflicts", name: "International Conflicts", region: "world", color: "#fb7185" },
  { slug: "space-astronomy", name: "Space & Astronomy", region: "world", color: "#818cf8" },
];

export const BRAZIL_CATEGORIES: CategoryDef[] = [
  { slug: "br-politics", name: "Brazilian Politics", region: "brazil", color: "#facc15" },
  { slug: "br-economy", name: "Economy & Inflation", region: "brazil", color: "#4ade80" },
  { slug: "br-justice", name: "Crime & Justice", region: "brazil", color: "#f87171" },
  { slug: "br-education", name: "Education", region: "brazil", color: "#38bdf8" },
  { slug: "br-regional", name: "Regional News", region: "brazil", color: "#fb923c" },
  { slug: "br-tech", name: "Tech Innovation", region: "brazil", color: "#e879f9" },
];

export const ALL_CATEGORIES: CategoryDef[] = [...WORLD_CATEGORIES, ...BRAZIL_CATEGORIES];

export const CATEGORY_BY_SLUG: Record<string, CategoryDef> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.slug, c]),
);

export function categoriesFor(region: "world" | "brazil"): CategoryDef[] {
  return region === "world" ? WORLD_CATEGORIES : BRAZIL_CATEGORIES;
}
