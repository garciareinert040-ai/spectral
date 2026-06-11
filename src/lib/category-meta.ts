import { CATEGORY_BY_SLUG } from "@shared/categories";

/**
 * Per-category visual identity. Class strings are written out literally so
 * Tailwind's scanner picks them up.
 */
export interface CategoryMeta {
  label: string;
  badge: string;
  dot: string;
  /** Gradient used for image-less cards and fallbacks */
  gradient: string;
}

const META: Record<string, Omit<CategoryMeta, "label">> = {
  "technology-ai": {
    badge: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
    dot: "bg-violet-400",
    gradient: "from-violet-600/30 via-purple-500/15 to-transparent",
  },
  "politics-government": {
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
    gradient: "from-blue-600/30 via-sky-500/15 to-transparent",
  },
  "business-markets": {
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    gradient: "from-emerald-600/30 via-teal-500/15 to-transparent",
  },
  "science-health": {
    badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30",
    dot: "bg-cyan-400",
    gradient: "from-cyan-600/30 via-sky-500/15 to-transparent",
  },
  "climate-environment": {
    badge: "bg-lime-500/15 text-lime-600 dark:text-lime-300 border-lime-500/30",
    dot: "bg-lime-400",
    gradient: "from-lime-600/30 via-green-500/15 to-transparent",
  },
  "international-conflicts": {
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    gradient: "from-rose-600/30 via-red-500/15 to-transparent",
  },
  "space-astronomy": {
    badge: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
    dot: "bg-indigo-400",
    gradient: "from-indigo-600/35 via-violet-500/15 to-transparent",
  },
  "br-politics": {
    badge: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-300 border-yellow-500/30",
    dot: "bg-yellow-400",
    gradient: "from-yellow-600/30 via-amber-500/15 to-transparent",
  },
  "br-economy": {
    badge: "bg-green-500/15 text-green-600 dark:text-green-300 border-green-500/30",
    dot: "bg-green-400",
    gradient: "from-green-600/30 via-emerald-500/15 to-transparent",
  },
  "br-justice": {
    badge: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30",
    dot: "bg-red-400",
    gradient: "from-red-600/30 via-rose-500/15 to-transparent",
  },
  "br-education": {
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
    gradient: "from-sky-600/30 via-blue-500/15 to-transparent",
  },
  "br-regional": {
    badge: "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
    gradient: "from-orange-600/30 via-amber-500/15 to-transparent",
  },
  "br-tech": {
    badge: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30",
    dot: "bg-fuchsia-400",
    gradient: "from-fuchsia-600/30 via-pink-500/15 to-transparent",
  },
};

const FALLBACK: Omit<CategoryMeta, "label"> = {
  badge: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  dot: "bg-slate-400",
  gradient: "from-slate-600/30 via-slate-500/15 to-transparent",
};

export function categoryMeta(slug: string): CategoryMeta {
  const def = CATEGORY_BY_SLUG[slug];
  const visuals = META[slug] ?? FALLBACK;
  return { label: def?.name ?? slug, ...visuals };
}
