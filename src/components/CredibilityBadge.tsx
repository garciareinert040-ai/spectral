import { BadgeCheck, Star } from "lucide-react";
import { SOURCE_BY_SLUG } from "@shared/sources";
import type { CredibilityTier } from "@shared/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  tier: CredibilityTier;
  sourceSlug: string;
  className?: string;
}

/** Gold star = Tier 1 (wire/public-interest standard); check = Tier 2 (specialist press). */
export function CredibilityBadge({ tier, sourceSlug, className }: Props) {
  const source = SOURCE_BY_SLUG[sourceSlug];
  const label =
    tier === 1
      ? "Tier 1 · Gold-standard neutrality"
      : "Tier 2 · Specialist, evidence-based press";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex cursor-help items-center", className)}
          aria-label={label}
        >
          {tier === 1 ? (
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ) : (
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{label}</p>
        {source ? <p className="mt-1 text-muted-foreground">{source.why}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}
