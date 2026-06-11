import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_CATEGORIES } from "../../shared/categories";
import { SOURCES } from "../../shared/sources";
import type { Article, ArticleFilters, SourceRefreshStat } from "../../shared/types";
import { config } from "./config";

interface ArticleRow {
  hash: string;
  title: string;
  url: string;
  source_slug: string;
  source_name: string;
  category_slug: string;
  region: string;
  summary: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  tier: number;
}

function toRow(a: Article): ArticleRow {
  return {
    hash: a.hash,
    title: a.title,
    url: a.url,
    source_slug: a.source,
    source_name: a.sourceName,
    category_slug: a.category,
    region: a.region,
    summary: a.summary,
    image_url: a.imageUrl,
    author: a.author,
    published_at: a.publishedAt,
    fetched_at: a.fetchedAt,
    tier: a.tier,
  };
}

function fromRow(r: ArticleRow): Article {
  return {
    hash: r.hash,
    title: r.title,
    url: r.url,
    source: r.source_slug,
    sourceName: r.source_name,
    category: r.category_slug,
    region: r.region as Article["region"],
    summary: r.summary,
    imageUrl: r.image_url,
    author: r.author,
    publishedAt: r.published_at,
    fetchedAt: r.fetched_at,
    tier: (r.tier === 1 ? 1 : 2) as Article["tier"],
  };
}

/** Upsert the category/source registry so article FKs always resolve. */
export async function ensureRegistry(db: SupabaseClient): Promise<void> {
  const categories = ALL_CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    region: c.region,
    color: c.color,
  }));
  const sources = SOURCES.map((s) => ({
    slug: s.slug,
    name: s.name,
    region: s.region,
    tier: s.tier,
    homepage: s.homepage,
    why: s.why,
  }));

  const [catRes, srcRes] = await Promise.all([
    db.from("categories").upsert(categories, { onConflict: "slug" }),
    db.from("sources").upsert(sources, { onConflict: "slug" }),
  ]);
  if (catRes.error) throw new Error(`categories upsert: ${catRes.error.message}`);
  if (srcRes.error) throw new Error(`sources upsert: ${srcRes.error.message}`);
}

/** Insert new articles (ON CONFLICT DO NOTHING). Returns how many were new. */
export async function saveArticles(db: SupabaseClient, articles: Article[]): Promise<number> {
  let inserted = 0;
  const CHUNK = 200;
  for (let i = 0; i < articles.length; i += CHUNK) {
    const chunk = articles.slice(i, i + CHUNK).map(toRow);
    const { data, error } = await db
      .from("articles")
      .upsert(chunk, { onConflict: "hash", ignoreDuplicates: true })
      .select("hash");
    if (error) throw new Error(`articles upsert: ${error.message}`);
    inserted += data?.length ?? 0;
  }
  return inserted;
}

/** Trim storage to the newest N articles (see prune_articles() in supabase/schema.sql). */
export async function pruneArticles(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.rpc("prune_articles", {
    keep_count: config.maxArticlesRetained,
  });
  if (error) throw new Error(`prune_articles: ${error.message}`);
  return typeof data === "number" ? data : 0;
}

export async function recordSourceStatus(
  db: SupabaseClient,
  stats: SourceRefreshStat[],
): Promise<void> {
  const bySource = new Map<string, { fetched: number; errors: string[] }>();
  for (const s of stats) {
    const agg = bySource.get(s.source) ?? { fetched: 0, errors: [] };
    agg.fetched += s.fetched;
    if (s.error) agg.errors.push(s.error);
    bySource.set(s.source, agg);
  }
  const now = new Date().toISOString();
  const rows = [...bySource.entries()].map(([slug, agg]) => ({
    slug,
    last_fetched_at: now,
    last_error: agg.errors.length > 0 ? agg.errors.join("; ").slice(0, 500) : null,
  }));
  // Patch per-row to avoid clobbering registry fields with an upsert.
  await Promise.all(
    rows.map((r) =>
      db
        .from("sources")
        .update({ last_fetched_at: r.last_fetched_at, last_error: r.last_error })
        .eq("slug", r.slug),
    ),
  );
}

export async function getLastUpdated(db: SupabaseClient): Promise<string | null> {
  const { data, error } = await db
    .from("articles")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0].fetched_at as string;
}

export interface QueryResult {
  articles: Article[];
  total: number;
}

export async function queryArticles(
  db: SupabaseClient,
  f: ArticleFilters,
): Promise<QueryResult> {
  const limit = Math.min(Math.max(f.limit ?? 60, 1), 200);
  const offset = Math.max(f.offset ?? 0, 0);

  let q = db
    .from("articles")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (f.region) q = q.eq("region", f.region);
  if (f.category) q = q.eq("category_slug", f.category);
  if (f.source) q = q.eq("source_slug", f.source);
  if (f.from) q = q.gte("published_at", `${f.from}T00:00:00Z`);
  if (f.to) q = q.lte("published_at", `${f.to}T23:59:59Z`);
  if (f.q) {
    // PostgREST .or() — strip reserved chars from user input, quote the pattern.
    const needle = f.q.replace(/["\\,()]/g, " ").trim();
    if (needle) {
      q = q.or(`title.ilike."%${needle}%",summary.ilike."%${needle}%"`);
    }
  }

  const { data, error, count } = await q;
  if (error) throw new Error(`articles query: ${error.message}`);
  return {
    articles: (data as ArticleRow[]).map(fromRow),
    total: count ?? 0,
  };
}
