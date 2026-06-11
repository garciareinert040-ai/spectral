import { useCallback, useMemo, useState } from "react";
import type { Region } from "@shared/types";
import { Featured, pickFeatured } from "@/components/Featured";
import { FilterBar, EMPTY_FILTERS, type Filters } from "@/components/FilterBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { NewsGrid } from "@/components/NewsGrid";
import { SavedSheet } from "@/components/SavedSheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useArticles } from "@/hooks/useArticles";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { useNow } from "@/hooks/useNow";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { useTheme } from "@/hooks/useTheme";

function Dashboard() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { toast } = useToast();
  const now = useNow();

  const [region, setRegion] = useState<Region>("world");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [savedOpen, setSavedOpen] = useState(false);

  const queryFilters = useMemo(
    () => ({
      region,
      q: filters.q || undefined,
      category: filters.category || undefined,
      source: filters.source || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [region, filters],
  );

  const {
    articles,
    total,
    lastUpdated,
    mode,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useArticles(queryFilters);

  const handleRegionChange = useCallback((next: Region) => {
    setRegion(next);
    // Category/source slugs are region-specific; keep search & dates.
    setFilters((f) => ({ ...f, category: "", source: "" }));
  }, []);

  const handleRefresh = useCallback(async () => {
    const res = await refresh();
    if (!res) {
      toast("error", "Refresh failed", "Check the connection and try again.");
      return;
    }
    if (res.skipped) {
      toast("info", "Already up to date", res.reason);
      return;
    }
    const feedErrors = res.stats.filter((s) => s.error).length;
    const headline =
      res.mode === "supabase"
        ? `Fetched ${res.fetched.toLocaleString()} articles · ${res.inserted.toLocaleString()} new`
        : `Fetched ${res.fetched.toLocaleString()} articles`;
    toast(
      feedErrors > 0 ? "info" : "success",
      headline,
      feedErrors > 0
        ? `${feedErrors} feed${feedErrors === 1 ? "" : "s"} reported errors · ${(res.durationMs / 1000).toFixed(1)}s`
        : `All sources responded · ${(res.durationMs / 1000).toFixed(1)}s`,
    );
  }, [refresh, toast]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.category !== "" ||
    filters.source !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  const featuredPicks = useMemo(
    () => (!hasActiveFilters && !loading ? pickFeatured(articles) : []),
    [hasActiveFilters, loading, articles],
  );
  const showFeatured = featuredPicks.length === 3;
  const gridArticles = useMemo(() => {
    if (!showFeatured) return articles;
    const featuredHashes = new Set(featuredPicks.map((a) => a.hash));
    return articles.filter((a) => !featuredHashes.has(a.hash));
  }, [articles, featuredPicks, showFeatured]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
        now={now}
        onOpenSaved={() => setSavedOpen(true)}
      />

      <main className="flex-1">
        <Hero total={total} lastUpdated={lastUpdated} mode={mode} now={now} />

        <FilterBar
          region={region}
          onRegionChange={handleRegionChange}
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={loading ? null : total}
        />

        <div className="space-y-10 py-8 lg:py-10">
          {showFeatured ? <Featured articles={featuredPicks} now={now} /> : null}

          <NewsGrid
            articles={gridArticles}
            total={total}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            mode={mode}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onClearFilters={() => setFilters(EMPTY_FILTERS)}
            now={now}
          />
        </div>
      </main>

      <Footer />
      <SavedSheet open={savedOpen} onOpenChange={setSavedOpen} now={now} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TooltipProvider delayDuration={250}>
        <FavoritesProvider>
          <Dashboard />
        </FavoritesProvider>
      </TooltipProvider>
    </ToastProvider>
  );
}
