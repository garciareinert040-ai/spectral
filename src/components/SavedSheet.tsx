import { ArrowUpRight, BookmarkX, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { useFavorites } from "@/hooks/useFavorites";
import { categoryMeta } from "@/lib/category-meta";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
}

export function SavedSheet({ open, onOpenChange, now }: Props) {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="border-b p-6 pb-4">
          <SheetTitle className="font-display">
            Saved articles
            {favorites.length > 0 ? (
              <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                ({favorites.length})
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription>
            Stored in this browser{favorites.length > 0 ? " — synced to Supabase when configured" : ""}.
          </SheetDescription>
        </SheetHeader>

        <div className="nice-scroll flex-1 overflow-y-auto px-6 py-4">
          {favorites.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <BookmarkX className="h-9 w-9 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium">Nothing saved yet</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                Tap the bookmark on any card to keep it here for later reading.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {favorites.map((article, i) => {
                const meta = categoryMeta(article.category);
                return (
                  <li key={article.hash}>
                    {i > 0 ? <Separator className="mb-1" /> : null}
                    <div className="group rounded-lg p-2.5 transition-colors hover:bg-accent/60">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("border", meta.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </Badge>
                        <button
                          onClick={() => toggleFavorite(article)}
                          aria-label="Remove from saved"
                          className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block font-display text-sm font-semibold leading-snug underline-offset-4 hover:underline"
                      >
                        {article.title}
                        <ArrowUpRight className="ml-1 inline h-3 w-3 align-baseline opacity-50" />
                      </a>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CredibilityBadge tier={article.tier} sourceSlug={article.source} />
                        <span>{article.sourceName}</span>
                        <span>·</span>
                        <span>{timeAgo(article.publishedAt, now)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="border-t p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFavorites}
              className="w-full gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all saved articles
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
