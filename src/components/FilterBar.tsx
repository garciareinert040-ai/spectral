import { useEffect, useState } from "react";
import { CalendarDays, Globe2, MapPin, Search, X } from "lucide-react";
import { categoriesFor } from "@shared/categories";
import { sourcesFor } from "@shared/sources";
import type { Region } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Filters {
  q: string;
  category: string;
  source: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: Filters = { q: "", category: "", source: "", from: "", to: "" };

interface Props {
  region: Region;
  onRegionChange: (region: Region) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  resultCount: number | null;
}

export function FilterBar({ region, onRegionChange, filters, onFiltersChange, resultCount }: Props) {
  // Local echo of the search box so typing stays snappy; commit after 350ms.
  const [search, setSearch] = useState(filters.q);

  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (search !== filters.q) onFiltersChange({ ...filters, q: search });
    }, 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const categories = categoriesFor(region);
  const sources = sourcesFor(region);
  const hasActiveFilters =
    filters.q !== "" || filters.category !== "" || filters.source !== "" || filters.from !== "" || filters.to !== "";

  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="sticky top-16 z-30 border-b bg-background/85 py-3 backdrop-blur-lg">
      <div className="container flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={region} onValueChange={(v) => onRegionChange(v as Region)}>
            <TabsList>
              <TabsTrigger value="world">
                <Globe2 className="h-4 w-4" />
                World News
              </TabsTrigger>
              <TabsTrigger value="brazil">
                <MapPin className="h-4 w-4" />
                Brazil
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search headlines and summaries…"
              className="pl-9"
              aria-label="Search articles"
            />
          </div>

          {resultCount !== null ? (
            <span className="hidden text-xs tabular-nums text-muted-foreground lg:block">
              {resultCount.toLocaleString()} result{resultCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
            aria-label="Filter by category"
            className="w-[200px]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.source}
            onChange={(e) => set({ source: e.target.value })}
            aria-label="Filter by source"
            className="w-[200px]"
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.tier === 1 ? "★ " : "✓ "}
                {s.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <Input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => set({ from: e.target.value })}
              aria-label="Published after"
              className="w-[140px] text-xs"
            />
            <span className="text-xs">–</span>
            <Input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => set({ to: e.target.value })}
              aria-label="Published before"
              className="w-[140px] text-xs"
            />
          </div>

          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange(EMPTY_FILTERS)}
              className="gap-1.5 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
