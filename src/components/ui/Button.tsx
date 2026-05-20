"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-sans rounded-pill " +
  "transition-all duration-200 ease-hearth " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "px-6 py-3.5 text-[15px] font-semibold bg-accent text-accent-on " +
    "hover:bg-accent-ink hover:-translate-y-px hover:shadow-lift " +
    "active:translate-y-0 active:shadow-lift-sm " +
    "disabled:bg-ink-mute disabled:hover:translate-y-0 disabled:hover:shadow-none",
  secondary:
    "px-6 py-3.5 text-[15px] font-semibold bg-transparent text-accent " +
    "border border-accent-soft " +
    "hover:bg-accent-soft",
  ghost:
    "px-4 py-2.5 text-sm font-medium bg-transparent text-ink-soft " +
    "hover:text-ink",
  // Hit-area-only variant for icon/circular buttons. The 44×44 box (iOS HIG / WCAG 2.5.5)
  // is invisible; the caller renders the visible element as a child (typically a w-8 h-8
  // circle span) which carries its own bg/hover/active styles. Per ADR-005.
  icon: "w-11 h-11",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  extra?: string,
) {
  return cn(buttonBase, buttonVariants[variant], extra);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={buttonClass(variant, className)}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
