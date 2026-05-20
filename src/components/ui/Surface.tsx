import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SurfaceTreatment = "bordered" | "glass" | "flat";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  treatment?: SurfaceTreatment;
  children: ReactNode;
}

const treatments: Record<SurfaceTreatment, string> = {
  bordered: "bg-card border border-rule rounded shadow-lift-sm",
  glass:
    "bg-glass-base backdrop-blur-glass backdrop-saturate-glass border border-glass-line rounded shadow-glass",
  flat: "bg-card rounded",
};

export function Surface({
  treatment = "bordered",
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div className={cn(treatments[treatment], className)} {...rest}>
      {children}
    </div>
  );
}
