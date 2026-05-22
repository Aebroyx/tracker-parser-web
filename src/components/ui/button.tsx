/**
 * Shadcn Button primitive — themed to Instaghost ghost aesthetic.
 * See: docs/DESIGN_LANGUAGE.md §5.2 (variants, sizes, touch-target rules).
 *
 * Re-themed from the default Shadcn radix-nova template:
 *  - `default` uses the spectral lavender gradient (`--gradient-accent`)
 *    with a soft glow + lift on hover — never a solid loud purple.
 *  - `destructive` uses solid `--accent-red` (only non-purple primary fill).
 *  - `outline` / `ghost` follow the secondary button rules in §5.2.
 *  - All sizes meet the 44px mobile touch-target rule (§9.1) and collapse
 *    to compact heights at `sm+`.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  [
    // Layout + typography (shared by all variants)
    "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium",
    // Transitions
    "transition-[box-shadow,transform,filter,background-color,color,border-color] duration-150 ease-out",
    // Focus / disabled / a11y
    "outline-none select-none focus-visible:ring-1 focus-visible:ring-accent-primary",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    // Icon defaults (Lucide)
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary CTA — spectral lavender gradient + glow + lift on hover.
        default: [
          "bg-[image:var(--gradient-accent)] text-text-on-accent",
          "hover:brightness-110 hover:-translate-y-px",
          "hover:shadow-[0_0_0_1px_hsla(275,45%,88%,0.55),0_0_20px_hsla(265,50%,78%,0.32)]",
          "active:translate-y-0 active:brightness-105",
          "active:shadow-[0_0_0_1px_hsla(275,45%,88%,0.35)]",
        ].join(" "),
        // Destructive — solid muted red (semantic, never mixed with purple glow).
        destructive: [
          "bg-accent-red text-white",
          "hover:brightness-110",
          "active:brightness-105",
          "focus-visible:ring-accent-red",
        ].join(" "),
        // Secondary outline — transparent fill, default border, secondary text.
        outline: [
          "border-border-default bg-transparent text-text-secondary",
          "hover:bg-bg-tertiary hover:text-text-primary",
          "aria-expanded:bg-bg-tertiary aria-expanded:text-text-primary",
        ].join(" "),
        // Ghost — no border, no fill until hover.
        ghost: [
          "bg-transparent text-text-secondary",
          "hover:bg-bg-tertiary hover:text-text-primary",
          "aria-expanded:bg-bg-tertiary aria-expanded:text-text-primary",
        ].join(" "),
        // Inline text link.
        link: [
          "bg-transparent text-accent-primary underline-offset-4",
          "hover:text-accent-primary-hover hover:underline",
          "px-0 py-0", // collapse padding so links flow inline
        ].join(" "),
      },
      size: {
        // Default — mobile-first 44px touch target, compact at sm+.
        default: "min-h-[44px] sm:h-9 px-4 py-2",
        // Compact toolbar / inline emphasis (still readable on desktop).
        sm: "h-9 px-3 text-xs sm:text-sm",
        // Square icon button — 44px tap target on mobile, 36px desktop.
        icon: "min-h-[44px] min-w-[44px] sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
