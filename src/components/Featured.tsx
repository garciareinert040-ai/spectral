import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Article } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { categoryMeta } from "@/lib/category-meta";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  articles: Article[];
  now: number;
}

/** Pick the lead stories: freshest tier-1 pieces, preferring ones with images. */
export function pickFeatured(articles: Article[]): Article[] {
  const pool = articles.slice(0, 40);
  const tier1WithImage = pool.filter((a) => a.tier === 1 && a.imageUrl);
  const tier1 = pool.filter((a) => a.tier === 1 && !a.imageUrl);
  const withImage = pool.filter((a) => a.tier !== 1 && a.imageUrl);
  const rest = pool.filter((a) => a.tier !== 1 && !a.imageUrl);
  const ranked = [...tier1WithImage, ...tier1, ...withImage, ...rest];
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const a of ranked) {
    if (seen.has(a.source)) continue; // variety: one lead per source
    seen.add(a.source);
    out.push(a);
    if (out.length === 3) break;
  }
  return out.length === 3 ? out : ranked.slice(0, 3);
}

function FeaturedTile({
  article,
  now,
  large,
}: {
  article: Article;
  now: number;
  large?: boolean;
}) {
  const meta = categoryMeta(article.category);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-2xl border bg-card",
        "transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-2xl hover:shadow-black/20",
        large ? "min-h-[300px] lg:row-span-2 lg:min-h-[460px]" : "min-h-[180px] lg:min-h-[218px]",
      )}
    >
      {article.imageUrl ? (
        <>
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        </>
      ) : (
        <div
          className={cn(
            "grid-texture absolute inset-0 bg-gradient-to-br",
            meta.gradient,
            "from-30%",
          )}
        />
      )}

      <div className={cn("relative p-5", large && "lg:p-7")}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("border backdrop-blur-sm", meta.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </Badge>
          {article.isSample ? (
            <Badge variant="muted" className="uppercase backdrop-blur-sm">
              Sample
            </Badge>
          ) : null}
        </div>
        <h3
          className={cn(
            "mt-3 font-display font-semibold leading-snug tracking-tight text-balance",
            article.imageUrl ? "text-white" : "text-foreground",
            large ? "text-2xl lg:text-[1.9rem]" : "text-lg",
          )}
        >
          {article.title}
        </h3>
        <div
          className={cn(
            "mt-3 flex items-center gap-2 text-xs",
            article.imageUrl ? "text-white/75" : "text-muted-foreground",
          )}
        >
          <CredibilityBadge tier={article.tier} sourceSlug={article.source} />
          <span className="font-medium">{article.sourceName}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt, now)}</span>
          <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}

export function Featured({ articles, now }: Props) {
  const picks = articles;
  if (picks.length < 3) return null;

  return (
    <section aria-label="Featured stories" className="container">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-4 w-4 text-amber-400" />
        Featured stories
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <FeaturedTile article={picks[0]} now={now} large />
        <FeaturedTile article={picks[1]} now={now} />
        <FeaturedTile article={picks[2]} now={now} />
      </div>
    </section>
  );
}
