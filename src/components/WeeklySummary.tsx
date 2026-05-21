"use client";

import Link from "next/link";
import useSWR from "swr";
import { Loader2, BarChart3 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import MacroGrid, { type MacroValues } from "@/components/ui/MacroGrid";
import { Mono } from "@/components/ui/Mono";
import { SerifIt } from "@/components/ui/SerifIt";
import type { MostCookedRecipe } from "@/lib/data";

interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

// Daily targets matching prototype data.js. Same constants used in
// TodaySnapshot + FoodLogForm. Extract to shared module when 4th call
// site materializes.
const DAILY_TARGETS = {
  cal: 2100,
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WeeklySummaryProps {
  topRecipes: MostCookedRecipe[];
}

export default function WeeklySummary({ topRecipes }: WeeklySummaryProps) {
  const today = new Date().toISOString().split("T")[0];
  // Fetch 14 days so we can split into current week + previous week for the
  // trend % delta. Previous-week fallback gracefully handles thin data
  // (returns 0% delta if there's nothing to compare against).
  const { data, isLoading } = useSWR(
    `/api/log-meal?date=${today}&days=14`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  // Aggregate entries by date over the full 14-day window.
  const byDate = new Map<
    string,
    { cal: number; p: number; c: number; f: number; count: number }
  >();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    byDate.set(key, { cal: 0, p: 0, c: 0, f: 0, count: 0 });
  }

  if (data?.entries) {
    for (const entry of data.entries) {
      const existing = byDate.get(entry.log_date) || {
        cal: 0,
        p: 0,
        c: 0,
        f: 0,
        count: 0,
      };
      existing.cal += entry.calories || 0;
      existing.p += entry.protein_g || 0;
      existing.c += entry.carbs_g || 0;
      existing.f += entry.fat_g || 0;
      existing.count += 1;
      byDate.set(entry.log_date, existing);
    }
  }

  // Split into two 7-day windows: current (last 7 days) and previous (7 days before that).
  const allDays: DaySummary[] = [];
  byDate.forEach((vals, date) => {
    allDays.push({
      date,
      calories: vals.cal,
      protein: vals.p,
      carbs: vals.c,
      fat: vals.f,
      meals: vals.count,
    });
  });
  allDays.sort((a, b) => a.date.localeCompare(b.date)); // ASC for chronological windows

  const currentWeek = allDays.slice(-7);
  const previousWeek = allDays.slice(0, 7);

  const daysWithData = currentWeek.filter((d) => d.meals > 0);

  if (daysWithData.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-card border border-rule rounded shadow-lift-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-ink mb-5">
          <BarChart3 size={28} aria-hidden />
        </div>
        <h3 className="font-display text-[24px] text-ink mb-2">
          Nothing logged this week.
        </h3>
        <p className="font-sans text-sm text-ink-mute leading-relaxed max-w-[280px] mx-auto mb-6">
          Log a few meals and the seven-day rhythm shows up here.
        </p>
        <Link href="/log" className={buttonClass("primary")}>
          Log your first meal
        </Link>
      </div>
    );
  }

  // Average kcal per day (over days with data).
  const avgCount = daysWithData.length;
  const avgCal = Math.round(
    daysWithData.reduce((s, d) => s + d.calories, 0) / avgCount,
  );

  // Previous-week average for trend % computation.
  const prevDaysWithData = previousWeek.filter((d) => d.meals > 0);
  const prevAvgCal =
    prevDaysWithData.length > 0
      ? Math.round(
          prevDaysWithData.reduce((s, d) => s + d.calories, 0) /
            prevDaysWithData.length,
        )
      : 0;

  // Trend %: positive = current > prev. Null when prev had no data.
  const trendPct =
    prevAvgCal > 0
      ? Math.round(((avgCal - prevAvgCal) / prevAvgCal) * 1000) / 10
      : null;

  const onTargetPct = Math.round((avgCal / DAILY_TARGETS.cal) * 100);

  const averages: MacroValues = {
    calories: avgCal,
    protein: Math.round(
      daysWithData.reduce((s, d) => s + d.protein, 0) / avgCount,
    ),
    carbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / avgCount),
    fat: Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / avgCount),
  };

  // Bar chart: max of (target × 1.15, max-day) so the target line sits within
  // the chart area even on a low-intake week.
  const maxKcal = Math.max(
    DAILY_TARGETS.cal * 1.15,
    ...currentWeek.map((d) => d.calories),
  );

  function formatShortDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    if (dateStr === today) return "Today";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function dayLetter(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d
      .toLocaleDateString("en-US", { weekday: "short" })
      .charAt(0)
      .toUpperCase();
  }

  // Bar color: ink when within ±10% of target, ink-mute otherwise, ink/15 when
  // partial (no data day).
  function barColor(d: DaySummary): string {
    if (d.meals === 0) return "bg-ink/15";
    const ratio = d.calories / DAILY_TARGETS.cal;
    if (ratio >= 0.9 && ratio <= 1.1) return "bg-ink";
    return "bg-ink-mute";
  }

  return (
    <div>
      {/* Avg-kcal hero — TASK-027 Phase 5 prototype-parity (mobile.jsx MSummary
          lines 542-555). Editorial italic display number is the centerpiece. */}
      <section className="mb-8">
        <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-ink-soft mb-1">
          Avg kcal · weekday
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[56px] leading-none tracking-[-0.03em] text-ink">
            <SerifIt>{avgCal}</SerifIt>
          </span>
          <span className="text-sm text-ink-mute">kcal / day</span>
        </div>
        <div className="mt-2 text-[13px] text-ink-soft">
          {trendPct !== null && (
            <>
              <span
                className={
                  trendPct < 0
                    ? "text-accent-ink font-semibold"
                    : trendPct > 0
                      ? "text-ink font-semibold"
                      : "text-ink-mute font-semibold"
                }
              >
                {trendPct > 0 ? "+" : ""}
                <Mono>{trendPct}%</Mono>
              </span>{" "}
              vs last week.{" "}
            </>
          )}
          On target <Mono>{onTargetPct}%</Mono> of goal.
        </div>
      </section>

      {/* Bar chart — 7 days with dashed target line and labels above bars. */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-ink-soft">
            This week
          </h3>
          <span className="font-sans text-xs text-ink-mute">kcal / day</span>
        </div>
        <div className="relative h-44 mt-4">
          {/* Target line — dashed horizontal at target/max ratio. */}
          <div
            aria-hidden
            className="absolute left-0 right-0 border-t border-dashed border-accent/55 pointer-events-none"
            style={{ bottom: `${(DAILY_TARGETS.cal / maxKcal) * 100}%` }}
          />
          <div
            aria-hidden
            className="absolute right-0 -translate-y-1/2 text-[9px] font-semibold tracking-[0.08em] uppercase text-accent-ink bg-paper px-1"
            style={{ bottom: `${(DAILY_TARGETS.cal / maxKcal) * 100}%` }}
          >
            target
          </div>

          <div className="flex items-end gap-2.5 h-full">
            {currentWeek.map((d) => {
              const h = Math.max(2, (d.calories / maxKcal) * 100);
              return (
                <div
                  key={d.date}
                  className="flex-1 h-full flex flex-col justify-end relative"
                >
                  <div
                    className={`relative rounded-md transition-all duration-300 ${barColor(d)}`}
                    style={{ height: `${h}%` }}
                  >
                    {d.meals > 0 && (
                      <span className="absolute -top-4 left-0 right-0 text-center text-[10px] text-ink-soft">
                        <Mono>{d.calories}</Mono>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Day-letter labels under bars. */}
        <div className="flex gap-2.5 mt-2.5">
          {currentWeek.map((d) => (
            <span
              key={d.date}
              className={`flex-1 text-center text-[11px] font-medium ${
                d.meals === 0 ? "text-ink-mute" : "text-ink-soft"
              }`}
            >
              {dayLetter(d.date)}
            </span>
          ))}
        </div>
      </section>

      {/* Seven-day macro averages — kept under the bar chart. */}
      <section className="mb-10">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
          Seven-day averages
        </h3>
        <MacroGrid values={averages} />
      </section>

      {/* Most-cooked this month — ranked list from server prop. */}
      {topRecipes.length > 0 && (
        <section className="mb-10">
          <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
            Most-cooked this month
          </h3>
          <ol>
            {topRecipes.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center gap-4 py-3 border-b border-rule last:border-b-0"
              >
                <Mono className="text-xs text-ink-mute w-6">
                  {String(i + 1).padStart(2, "0")}
                </Mono>
                <span className="flex-1 font-display text-[16px] text-ink truncate">
                  <SerifIt>{r.name}</SerifIt>
                </span>
                <Mono className="text-sm text-ink-soft">{r.cookedCount}×</Mono>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Daily breakdown table — preserved for power users. */}
      <section className="bg-card border border-rule rounded shadow-lift-sm p-6 overflow-x-auto">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-4">
          Daily breakdown
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              <th className="py-2 pr-4 text-left font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Day
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Meals
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Cal
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Protein
              </th>
              <th className="py-2 px-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Carbs
              </th>
              <th className="py-2 pl-2 text-right font-sans text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-mute">
                Fat
              </th>
            </tr>
          </thead>
          <tbody>
            {[...currentWeek].reverse().map((day) => {
              const empty = day.meals === 0;
              return (
                <tr
                  key={day.date}
                  className="border-b border-rule last:border-b-0"
                >
                  <td className="py-3 pr-4 font-sans text-sm font-medium text-ink">
                    {formatShortDate(day.date)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-sm text-ink-mute tabular-nums">
                    {empty ? "—" : day.meals}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-sm font-semibold text-ink tabular-nums">
                    {empty ? "—" : day.calories}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {empty ? "—" : `${day.protein}g`}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {empty ? "—" : `${day.carbs}g`}
                  </td>
                  <td className="py-3 pl-2 text-right font-mono text-sm text-ink-soft tabular-nums">
                    {empty ? "—" : `${day.fat}g`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
