"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  accent?: boolean;
  active?: boolean;
  children: ReactNode;
}

// Pill chip used for filter rows, dietary tags, and inline status markers.
// `accent` paints it terracotta; `active` is for filter-toggle state.
export function Tag({
  accent = false,
  active = false,
  className,
  children,
  ...rest
}: TagProps) {
  const isPressable = rest.onClick != null || rest.type != null;

  return (
    <button
      type={isPressable ? (rest.type ?? "button") : "button"}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5",
        "font-sans font-medium text-[13px] rounded-pill",
        "border border-transparent transition-colors duration-150",
        accent || active
          ? "bg-accent text-accent-on"
          : "bg-card text-ink-soft border-rule hover:bg-accent-soft hover:text-accent-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
