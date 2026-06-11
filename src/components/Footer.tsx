import { BadgeCheck, Star } from "lucide-react";
import { SOURCES } from "@shared/sources";

const REPO_URL = "https://github.com/garciareinert040-ai/spectral";

export function Footer() {
  const tier1 = SOURCES.filter((s) => s.tier === 1);
  const tier2 = SOURCES.filter((s) => s.tier === 2);

  return (
    <footer className="mt-16 border-t bg-card/40">
      <div className="container grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold tracking-tight">Spectral</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A fact-first dashboard limited to wire services, public broadcasters, non-profit
            newsrooms and specialist press. Editorial and opinion desks are excluded by design —
            see the full methodology for how sources are selected and tiered.
          </p>
          <a
            href={`${REPO_URL}/blob/HEAD/docs/SOURCES.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4 hover:text-foreground/80"
          >
            Read the sourcing methodology →
          </a>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Credibility tiers
          </p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex gap-3">
              <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              <div>
                <p className="font-medium">Tier 1 — Gold standard</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {tier1.map((s) => s.name).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="font-medium">Tier 2 — Specialist press</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {tier2.map((s) => s.name).join(" · ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </p>
          <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              Headlines and summaries remain © their publishers; every card links to the original
              article at the source.
            </li>
            <li>
              Content is ingested from public RSS/Atom feeds. Reuters, AP and AFP headlines arrive
              via the Google News RSS proxy, as their direct APIs are enterprise-licensed.
            </li>
            <li>Updates are user-triggered — nothing syncs in the background.</li>
            <li>Built with React, Vite, Tailwind, Express on Vercel, and Supabase.</li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Spectral — Global News Dashboard</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Source code on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
