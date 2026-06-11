export type Region = "world" | "brazil";

/** 1 = gold-standard neutrality (wire services, public-interest newsrooms); 2 = specialist/technical press */
export type CredibilityTier = 1 | 2;

export interface CategoryDef {
  slug: string;
  name: string;
  region: Region;
  /** Hex accent, stored in DB and used for non-Tailwind consumers */
  color: string;
}

export interface FeedDef {
  url: string;
  /** Category applied when the classifier finds no strong signal */
  defaultCategory: string;
  /**
   * "fixed"   → feed is topic-specific; always use defaultCategory
   * "classify"→ general feed; run the keyword classifier per item
   */
  mode: "fixed" | "classify";
}

export interface SourceDef {
  slug: string;
  name: string;
  region: Region;
  tier: CredibilityTier;
  homepage: string;
  /** One-line rationale shown in tooltips and docs/SOURCES.md */
  why: string;
  feeds: FeedDef[];
  /** True when headlines arrive via the Google News RSS proxy (links resolve through news.google.com) */
  viaGoogleNews?: boolean;
}

export interface Article {
  /** Stable dedupe key (FNV-1a of canonical URL, or source+title for opaque proxy links) */
  hash: string;
  title: string;
  url: string;
  source: string;
  sourceName: string;
  category: string;
  region: Region;
  summary: string | null;
  imageUrl: string | null;
  author: string | null;
  /** ISO 8601 */
  publishedAt: string;
  /** ISO 8601 */
  fetchedAt: string;
  tier: CredibilityTier;
  /** Bundled placeholder shown only when no DB is configured and feeds are unreachable */
  isSample?: boolean;
}

export interface ArticleFilters {
  region?: Region;
  q?: string;
  category?: string;
  source?: string;
  /** ISO date (yyyy-mm-dd) inclusive lower bound on publishedAt */
  from?: string;
  /** ISO date (yyyy-mm-dd) inclusive upper bound on publishedAt */
  to?: string;
  limit?: number;
  offset?: number;
}

export type DataMode = "supabase" | "live" | "sample";

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  /** ISO timestamp of the most recent fetch, null before first refresh */
  lastUpdated: string | null;
  mode: DataMode;
}

export interface SourceRefreshStat {
  source: string;
  feed: string;
  fetched: number;
  error: string | null;
}

export interface RefreshResponse {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  mode: DataMode;
  fetched: number;
  inserted: number;
  pruned: number;
  durationMs: number;
  lastUpdated: string | null;
  stats: SourceRefreshStat[];
}

export interface HealthResponse {
  ok: boolean;
  mode: DataMode;
  supabaseConfigured: boolean;
  sources: number;
  feeds: number;
  lastUpdated: string | null;
  version: string;
}
