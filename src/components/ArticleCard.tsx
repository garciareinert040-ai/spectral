import { useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, Clock } from "lucide-react";
import type { Article } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { useFavorites } from "@/hooks/useFavorites";
import { categoryMeta } from "@/lib/category-meta";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  article: Article;
  index: number;
  now: number;
}

export function ArticleCard({ article, index, now }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageFailed, setImageFailed] = useState(false);
  const meta = categoryMeta(article.category);
  const saved = isFavorite(article.hash);
  const showImage = Boolean(article.imageUrl) && !imageFailed;

  return (
    <Card
      className={cn("card-hover group animate-card-in overflow-hidden")}
      style={{ animationDelay: `${(index % 12) * 45}ms` }}
    >
      {showImage ? (
        <a href={article.url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <img
              src={article.imageUrl!}
              alt=""
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </a>
      ) : (
        <div className={cn("h-1.5 w-full bg-gradient-to-r", meta.gradient)} />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("border", meta.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </Badge>
            {article.isSample ? (
              <Badge variant="muted" className="uppercase">
                Sample
              </Badge>
            ) : null}
          </div>
          <button
            onClick={() => toggleFavorite(article)}
            aria-label={saved ? "Remove from saved" : "Save article"}
            aria-pressed={saved}
            className={cn(
              "shrink-0 rounded-md p-1.5 transition-all",
              saved
                ? "text-amber-500 dark:text-amber-400"
                : "text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground group-hover:opacity-100",
            )}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-foreground/30 underline-offset-4 transition-colors hover:underline"
          >
            {article.title}
          </a>
        </h3>

        {article.summary ? (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {article.summary}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3.5 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <CredibilityBadge tier={article.tier} sourceSlug={article.source} />
            <span className="truncate font-medium text-foreground/80">{article.sourceName}</span>
            {article.author ? (
              <span className="hidden truncate sm:inline">· {article.author}</span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-default items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(article.publishedAt, now)}
                </span>
              </TooltipTrigger>
              <TooltipContent>Published {formatDate(article.publishedAt)}</TooltipContent>
            </Tooltip>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open at ${article.sourceName}`}
              className="rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
