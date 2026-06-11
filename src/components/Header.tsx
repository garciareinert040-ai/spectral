import { Bookmark, Loader2, Moon, RefreshCw, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFavorites } from "@/hooks/useFavorites";
import { timeAgo } from "@/lib/format";

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: string | null;
  now: number;
  onOpenSaved: () => void;
}

function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" className="fill-foreground/5" />
      <path
        d="M14 44 L32 12 L50 44"
        fill="none"
        stroke="url(#brand-g)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="20" y1="50" x2="44" y2="50" stroke="url(#brand-g)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Header({
  theme,
  onToggleTheme,
  onRefresh,
  refreshing,
  lastUpdated,
  now,
  onOpenSaved,
}: Props) {
  const { favorites } = useFavorites();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-3">
        <a href="/" className="flex items-center gap-3">
          <BrandMark />
          <div className="leading-none">
            <span className="font-display text-xl font-bold tracking-tight">Spectral</span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:block">
              Global News Desk
            </span>
          </div>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
            </span>
            Updated {timeAgo(lastUpdated, now)}
          </div>

          <Button onClick={onRefresh} disabled={refreshing} size="sm" className="gap-2">
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{refreshing ? "Fetching…" : "Refresh"}</span>
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSaved}
                className="relative gap-2"
                aria-label="Open saved articles"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
                {favorites.length > 0 ? (
                  <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                    {favorites.length > 99 ? "99+" : favorites.length}
                  </Badge>
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Saved articles</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
