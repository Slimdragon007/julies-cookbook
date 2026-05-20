"use client";

import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface InputLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function InputLabel({ className, children, ...rest }: InputLabelProps) {
  return (
    <label
      {...rest}
      className={cn(
        "block font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-accent",
        className,
      )}
    >
      {children}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...rest }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3.5",
        "font-sans text-base text-ink placeholder:text-ink-mute/60",
        "bg-card",
        "border border-rule rounded",
        "outline-none transition-colors duration-150",
        "hover:border-accent/30",
        "focus:border-accent focus:ring-2 focus:ring-accent/15",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...rest}
    />
  );
}
