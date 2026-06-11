import Parser from "rss-parser";
import { classify } from "../../shared/classify";
import type { Article, FeedDef, SourceDef } from "../../shared/types";
import { config } from "./config";

type CustomItem = {
  "media:content"?: unknown;
  "media:thumbnail"?: unknown;
  "content:encoded"?: string;
  creator?: string;
  author?: string;
};

const parser: Parser<Record<string, unknown>, CustomItem> = new Parser({
  customFields: {
    item: ["media:content", "media:thumbnail", "content:encoded", "creator"],
  },
});

const USER_AGENT =
  "Mozilla/5.0 (compatible; SpectralNews/1.0; +https://github.com/garciareinert040-ai/spectral)";

// ── Text utilities ────────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", eacute: "é", agrave: "à", ccedil: "ç",
  atilde: "ã", otilde: "õ", aacute: "á", iacute: "í", oacute: "ó", uacute: "ú",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

function safeFromCodePoint(cp: number): string {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

// ── URL / dedupe utilities ───────────────────────────────────────────────────

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|mc_cid|mc_eid|cmp|at_medium|at_campaign|ref$)/i;

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.hostname = u.hostname.toLowerCase();
    const toDelete: string[] = [];
    u.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.test(key)) toDelete.push(key);
    });
    toDelete.forEach((k) => u.searchParams.delete(k));
    let out = u.toString();
    if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch {
    return raw;
  }
}

function isOpaqueProxyLink(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("news.google.com");
  } catch {
    return false;
  }
}

/** FNV-1a 64-bit, hex string — stable dedupe key */
export function fnv1a(input: string): string {
  let h = 0xcbf29ce484222325n;
  const PRIME = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * PRIME) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}

/** Google News titles end with " - Publisher"; drop that segment. */
function cleanTitle(title: string, viaGoogleNews: boolean): string {
  const t = stripHtml(title);
  if (!viaGoogleNews) return t;
  const idx = t.lastIndexOf(" - ");
  return idx > 20 ? t.slice(0, idx).trim() : t;
}

// ── Image extraction ─────────────────────────────────────────────────────────

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function mediaUrl(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const attrs = (node as { $?: Record<string, string> }).$;
  const url = attrs?.url;
  if (!url) return null;
  const medium = attrs?.medium ?? "";
  const type = attrs?.type ?? "";
  if (medium && medium !== "image") return null;
  if (type && !type.startsWith("image/")) return null;
  return url;
}

function extractImage(item: Parser.Item & CustomItem): string | null {
  const candidates: (string | null)[] = [];

  const enclosure = item.enclosure;
  if (enclosure?.url && (!enclosure.type || enclosure.type.startsWith("image/"))) {
    candidates.push(enclosure.url);
  }
  for (const m of asArray(item["media:content"])) candidates.push(mediaUrl(m));
  for (const m of asArray(item["media:thumbnail"])) candidates.push(mediaUrl(m));

  const html = item["content:encoded"] ?? item.content ?? "";
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (imgMatch) candidates.push(imgMatch[1]);

  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c);
      if (u.protocol === "https:" || u.protocol === "http:") return c;
    } catch {
      /* skip invalid */
    }
  }
  return null;
}

// ── Date handling ────────────────────────────────────────────────────────────

function parseDate(item: Parser.Item): string {
  const raw = item.isoDate ?? item.pubDate ?? "";
  const t = Date.parse(raw);
  const now = Date.now();
  if (Number.isNaN(t)) return new Date(now).toISOString();
  // Clamp slightly-future timestamps (feed clock skew)
  return new Date(Math.min(t, now + 10 * 60 * 1000)).toISOString();
}

// ── Feed fetching ────────────────────────────────────────────────────────────

export interface FeedFetchResult {
  articles: Article[];
  error: string | null;
}

export async function fetchFeedArticles(
  source: SourceDef,
  feed: FeedDef,
): Promise<FeedFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.feedTimeoutMs);
  const fetchedAt = new Date().toISOString();

  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8",
      },
    });
    if (!res.ok) {
      return { articles: [], error: `HTTP ${res.status}` };
    }
    const xml = await res.text();
    const parsed = await parser.parseString(xml);
    const items = (parsed.items ?? []).slice(0, config.itemsPerFeed);

    const articles: Article[] = [];
    for (const item of items) {
      const link = (item.link ?? "").trim();
      const rawTitle = (item.title ?? "").trim();
      if (!link || !rawTitle) continue;

      const viaGoogle = Boolean(source.viaGoogleNews) && isOpaqueProxyLink(link);
      const title = cleanTitle(rawTitle, viaGoogle);
      if (title.length < 8) continue;

      const url = normalizeUrl(link);
      const hash = viaGoogle
        ? fnv1a(`${source.slug}|t|${title.toLowerCase()}`)
        : fnv1a(`${source.slug}|u|${url}`);

      const rawSummary =
        item.contentSnippet ?? item["content:encoded"] ?? item.content ?? item.summary ?? "";
      let summary: string | null = truncate(stripHtml(String(rawSummary)), 320);
      // Google News "summaries" are just repeated headline markup — drop them.
      if (viaGoogle && (summary.length < 30 || summary.startsWith(title.slice(0, 40)))) {
        summary = null;
      }
      if (summary !== null && summary.length < 12) summary = null;

      const category =
        feed.mode === "fixed"
          ? feed.defaultCategory
          : classify(title, summary, source.region, feed.defaultCategory);

      articles.push({
        hash,
        title,
        url,
        source: source.slug,
        sourceName: source.name,
        category,
        region: source.region,
        summary,
        imageUrl: viaGoogle ? null : extractImage(item),
        author: (item.creator ?? item.author ?? null) as string | null,
        publishedAt: parseDate(item),
        fetchedAt,
        tier: source.tier,
      });
    }
    return { articles, error: null };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? `timeout after ${config.feedTimeoutMs}ms`
          : err.message
        : String(err);
    return { articles: [], error: msg };
  } finally {
    clearTimeout(timer);
  }
}
