import { AlertCircle, ChevronDown, Loader2, Newspaper, WifiOff } from "lucide-react";
import type { Article, DataMode } from "@shared/types";
import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  articles: Article[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  mode: DataMode | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onClearFilters: () => void;
  now: number;
}

function SkeletonCard({ withImage }: { withImage: boolean }) {
  return (
    <Card className="overflow-hidden">
      {withImage ? <Skeleton className="aspect-[16/9] w-full rounded-none" /> : null}
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function NewsGrid({
  articles,
  total,
  loading,
  loadingMore,
  error,
  mode,
  hasMore,
  onLoadMore,
  onClearFilters,
  now,
}: Props) {
  return (
    <section aria-label="News articles" className="container">
      {mode === "sample" ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-orange-400/30 bg-orange-400/10 p-4 text-sm">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <div>
            <p className="font-medium">Showing bundled sample data</p>
            <p className="mt-0.5 text-muted-foreground">
              No database is configured and the news feeds were unreachable from this environment.
              Once deployed (or once Supabase is configured), hit Refresh to pull live headlines.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-0.5 text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="masonry" aria-busy="true" aria-label="Loading articles">
          {Array.from({ length: 9 }, (_, i) => (
            <SkeletonCard key={i} withImage={i % 3 === 0} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-xl font-semibold">No articles match</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Try widening the date range, clearing filters, or refreshing to pull the latest
            headlines from all sources.
          </p>
          <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-5">
            Clear all filters
          </Button>
        </div>
      ) : (
        <>
          <div className="masonry">
            {articles.map((article, i) => (
              <ArticleCard key={article.hash} article={article} index={i} now={now} />
            ))}
          </div>

          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <Button
                variant="secondary"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load more ({(total - articles.length).toLocaleString()} remaining)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
