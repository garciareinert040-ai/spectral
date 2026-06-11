import { Database, Globe2, Radio, Star } from "lucide-react";
import { FEED_COUNT, SOURCES } from "@shared/sources";
import type { DataMode } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  total: number;
  lastUpdated: string | null;
  mode: DataMode | null;
  now: number;
}

const MODE_LABEL: Record<DataMode, { text: string; icon: typeof Database }> = {
  supabase: { text: "Supabase persistence", icon: Database },
  live: { text: "Live mode · no database", icon: Radio },
  sample: { text: "Sample data · feeds unreachable", icon: Radio },
};

export function Hero({ total, lastUpdated, mode, now }: Props) {
  const tier1Count = SOURCES.filter((s) => s.tier === 1).length;
  const modeMeta = mode ? MODE_LABEL[mode] : null;

  const stats: { label: string; value: string }[] = [
    { label: "articles indexed", value: total > 0 ? total.toLocaleString() : "—" },
    { label: "vetted sources", value: String(SOURCES.length) },
    { label: "feeds monitored", value: String(FEED_COUNT) },
    { label: "last updated", value: timeAgo(lastUpdated, now) },
  ];

  return (
    <section className="hero-glow relative overflow-hidden border-b">
      <div className="grid-texture absolute inset-0" aria-hidden="true" />
      <div className="container relative py-14 lg:py-20">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300">
            <Star className="h-3 w-3 fill-current" />
            {tier1Count} Tier-1 wire & public-interest sources
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-sky-400/40 bg-sky-400/10 text-sky-600 dark:text-sky-300">
            <Globe2 className="h-3 w-3" />
            World + Brazil coverage
          </Badge>
          {modeMeta ? (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                mode === "sample"
                  ? "border-orange-400/40 bg-orange-400/10 text-orange-600 dark:text-orange-300"
                  : "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
              )}
            >
              <modeMeta.icon className="h-3 w-3" />
              {modeMeta.text}
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
          The signal,
          <br />
          without the noise.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Spectral aggregates wire services, public broadcasters, peer-reviewed and specialist
          press into one dashboard — categorized, credibility-tiered and refreshed on your command.
          No opinion desks. No engagement bait.
        </p>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card/90 px-5 py-4 backdrop-blur">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
