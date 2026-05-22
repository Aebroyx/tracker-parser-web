/**
 * Shadcn Progress primitive — themed to Instaghost ghost aesthetic.
 * See: docs/DESIGN_LANGUAGE.md §5.2.2 (track, indicator, transition rules).
 *
 * Re-themed from the default Shadcn radix-nova template:
 *  - Track height `h-1.5` (compact, inline in drop zones).
 *  - Track background `--bg-tertiary` (`bg-muted` via mapping).
 *  - Indicator fill `--accent-primary` (`bg-primary` via mapping) —
 *    solid spectral lavender, no gradient on small tracks.
 *  - Transform-based progression with `300ms ease-in-out` (§6).
 */

"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils/cn";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
