import WeeklySummary from "@/components/WeeklySummary";
import { BarChart3 } from "lucide-react";

export const runtime = "edge";

export const metadata = {
  title: "Weekly Summary — Julie's Cookbook",
};

export default function SummaryPage() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 px-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-accent">
              Pulse
            </span>
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-[1.05] mb-1">
            Weekly summary
          </h1>
          <p className="font-sans text-base text-ink-soft">
            Seven-day rhythm at a glance. Macros, meals, and the recipes Julie
            kept coming back to.
          </p>
        </header>
        <WeeklySummary />
      </div>
    </div>
  );
}
