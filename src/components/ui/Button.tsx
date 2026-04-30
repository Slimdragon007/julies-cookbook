"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-sans rounded-pill " +
  "transition-all duration-200 ease-hearth " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "px-6 py-3.5 text-[15px] font-semibold bg-brown text-cream " +
    "hover:bg-brown-deep hover:-translate-y-px hover:shadow-lift " +
    "active:translate-y-0 active:shadow-lift-sm " +
    "disabled:bg-ink-mute disabled:hover:translate-y-0 disabled:hover:shadow-none",
  secondary:
    "px-6 py-3.5 text-[15px] font-semibold bg-transparent text-brown " +
    "border border-brown-glass " +
    "hover:bg-brown-glass",
  ghost:
    "px-4 py-2.5 text-sm font-medium bg-transparent text-ink-soft " +
    "hover:text-ink",
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
