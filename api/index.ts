import express, { type Request, type Response, type NextFunction } from "express";
import { ALL_CATEGORIES } from "../shared/categories";
import { FEED_COUNT, SOURCES } from "../shared/sources";
import type {
  ArticleFilters,
  ArticlesResponse,
  HealthResponse,
  RefreshResponse,
  Region,
} from "../shared/types";
import { aggregate, type RefreshScope } from "./_lib/aggregate";
import { getCached, getLiveArticles } from "./_lib/cache";
import { APP_VERSION, config } from "./_lib/config";
import { applyFilters } from "./_lib/filters";
import { getSampleArticles } from "./_lib/sample";
import {
  ensureRegistry,
  getLastUpdated,
  pruneArticles,
  queryArticles,
  recordSourceStatus,
  saveArticles,
} from "./_lib/store";
import { getSupabase } from "./_lib/supabase";

const app = express();
app.use(express.json({ limit: "256kb" }));

// ── helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function parseRegion(v: unknown): Region | undefined {
  return v === "world" || v === "brazil" ? v : undefined;
}

function parseFilters(req: Request): ArticleFilters {
  const q = req.query;
  const num = (v: unknown): number | undefined => {
    const n = Number.parseInt(String(v ?? ""), 10);
    return Number.isNaN(n) ? undefined : n;
  };
  const date = (v: unknown): string | undefined => {
    const s = str(v);
    return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
  };
  return {
    region: parseRegion(q.region),
    q: str(q.q)?.slice(0, 120),
    category: str(q.category),
    source: str(q.source),
    from: date(q.from),
    to: date(q.to),
    limit: num(q.limit),
    offset: num(q.offset),
  };
}

function refreshAuthorized(req: Request): boolean {
  const token = config.refreshToken;
  if (!token) return true;
  const header = req.headers.authorization ?? "";
  if (header === `Bearer ${token}`) return true;
  return str(req.query.token) === token;
}

// ── routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", async (_req: Request, res: Response) => {
  const db = getSupabase();
  let lastUpdated: string | null = null;
  if (db) {
    try {
      lastUpdated = await getLastUpdated(db);
    } catch {
      /* health stays ok; DB detail surfaces via /api/articles errors */
    }
  } else {
    const cached = getCached();
    lastUpdated = cached ? new Date(cached.fetchedAt).toISOString() : null;
  }
  const body: HealthResponse = {
    ok: true,
    mode: db ? "supabase" : "live",
    supabaseConfigured: Boolean(db),
    sources: SOURCES.length,
    feeds: FEED_COUNT,
    lastUpdated,
    version: APP_VERSION,
  };
  res.json(body);
});

app.get("/api/sources", (_req: Request, res: Response) => {
  res.json({
    categories: ALL_CATEGORIES,
    sources: SOURCES.map((s) => ({
      slug: s.slug,
      name: s.name,
      region: s.region,
      tier: s.tier,
      homepage: s.homepage,
      why: s.why,
      feeds: s.feeds.length,
      viaGoogleNews: Boolean(s.viaGoogleNews),
    })),
  });
});

app.get("/api/articles", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req);
    const db = getSupabase();

    if (db) {
      const [{ articles, total }, lastUpdated] = await Promise.all([
        queryArticles(db, filters),
        getLastUpdated(db),
      ]);
      const body: ArticlesResponse = { articles, total, lastUpdated, mode: "supabase" };
      res.json(body);
      return;
    }

    // No DB → serve from the warm live cache (fetching feeds if stale)…
    const live = await getLiveArticles(false);
    if (live.articles.length > 0) {
      const { articles, total } = applyFilters(live.articles, filters);
      const body: ArticlesResponse = {
        articles,
        total,
        lastUpdated: new Date(live.fetchedAt).toISOString(),
        mode: "live",
      };
      res.json(body);
      return;
    }

    // …and fall back to bundled samples when nothing is reachable.
    const { articles, total } = applyFilters(getSampleArticles(), filters);
    const body: ArticlesResponse = { articles, total, lastUpdated: null, mode: "sample" };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

app.post("/api/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!refreshAuthorized(req)) {
      res.status(401).json({ ok: false, error: "invalid or missing refresh token" });
      return;
    }

    const scopeParam = str(req.query.scope);
    const scope: RefreshScope =
      scopeParam === "world" || scopeParam === "brazil" ? scopeParam : "all";
    const started = Date.now();
    const db = getSupabase();

    if (!db) {
      const live = await getLiveArticles(true);
      const mode = live.articles.length > 0 ? "live" : "sample";
      const body: RefreshResponse = {
        ok: true,
        mode,
        fetched: live.articles.length,
        inserted: 0,
        pruned: 0,
        durationMs: Date.now() - started,
        lastUpdated: new Date(live.fetchedAt).toISOString(),
        stats: live.stats,
      };
      res.json(body);
      return;
    }

    // Cooldown: skip if another refresh just landed (multi-tab, double-click, cron overlap).
    const last = await getLastUpdated(db);
    const cooldownMs = config.refreshCooldownSeconds * 1000;
    if (last && Date.now() - Date.parse(last) < cooldownMs) {
      const body: RefreshResponse = {
        ok: true,
        skipped: true,
        reason: `refreshed less than ${config.refreshCooldownSeconds}s ago`,
        mode: "supabase",
        fetched: 0,
        inserted: 0,
        pruned: 0,
        durationMs: Date.now() - started,
        lastUpdated: last,
        stats: [],
      };
      res.json(body);
      return;
    }

    const { articles, stats } = await aggregate(scope);
    await ensureRegistry(db);
    const inserted = articles.length > 0 ? await saveArticles(db, articles) : 0;
    const pruned = inserted > 0 ? await pruneArticles(db) : 0;
    await recordSourceStatus(db, stats);

    const body: RefreshResponse = {
      ok: true,
      mode: "supabase",
      fetched: articles.length,
      inserted,
      pruned,
      durationMs: Date.now() - started,
      lastUpdated: new Date().toISOString(),
      stats,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// ── favorites sync (optional — localStorage is the primary store) ────────────

app.get("/api/favorites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getSupabase();
    const deviceId = str(req.query.deviceId);
    if (!db || !deviceId) {
      res.json({ ok: true, synced: false, favorites: [] });
      return;
    }
    const { data, error } = await db
      .from("user_favorites")
      .select("article")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    res.json({ ok: true, synced: true, favorites: (data ?? []).map((r) => r.article) });
  } catch (err) {
    next(err);
  }
});

app.post("/api/favorites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getSupabase();
    const { deviceId, article } = req.body ?? {};
    if (!db) {
      res.json({ ok: true, synced: false });
      return;
    }
    if (typeof deviceId !== "string" || !article?.hash || typeof article.hash !== "string") {
      res.status(400).json({ ok: false, error: "deviceId and article.hash are required" });
      return;
    }
    const { error } = await db.from("user_favorites").upsert(
      {
        device_id: deviceId.slice(0, 64),
        article_hash: String(article.hash).slice(0, 64),
        article,
      },
      { onConflict: "device_id,article_hash" },
    );
    if (error) throw new Error(error.message);
    res.json({ ok: true, synced: true });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/favorites", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getSupabase();
    const deviceId = str(req.query.deviceId);
    const hash = str(req.query.hash);
    if (!db) {
      res.json({ ok: true, synced: false });
      return;
    }
    if (!deviceId || !hash) {
      res.status(400).json({ ok: false, error: "deviceId and hash are required" });
      return;
    }
    const { error } = await db
      .from("user_favorites")
      .delete()
      .eq("device_id", deviceId)
      .eq("article_hash", hash);
    if (error) throw new Error(error.message);
    res.json({ ok: true, synced: true });
  } catch (err) {
    next(err);
  }
});

// ── fallthrough & errors ─────────────────────────────────────────────────────

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: "not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[spectral]", err);
  res.status(500).json({ ok: false, error: err.message || "internal error" });
});

export default app;
