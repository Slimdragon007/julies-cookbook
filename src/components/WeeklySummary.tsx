"use client";

import Link from "next/link";
import useSWR from "swr";
import { Loader2, BarChart3 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import MacroGrid, { type MacroValues } from "@/components/ui/MacroGrid";

interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WeeklySummary() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading } = useSWR(
    `/api/log-meal?date=${today}&days=7`,
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

  // Process entries into daily summaries.
  const byDate = new Map<
    string,
    { cal: number; p: number; c: number; f: number; count: number }
  >();
  for (let i = 6; i >= 0; i--) {
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

  const days: DaySummary[] = [];
  byDate.forEach((vals, date) => {
    days.push({
      date,
      calories: vals.cal,
      protein: vals.p,
      carbs: vals.c,
      fat: vals.f,
      meals: vals.count,
    });
  });
  days.sort((a, b) => b.date.localeCompare(a.date));

  const daysWithData = days.filter((d) => d.meals > 0);

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

  const avgCount = daysWithData.length;
  const averages: MacroValues = {
    calories: Math.round(
      daysWithData.reduce((s, d) => s + d.calories, 0) / avgCount,
    ),
    protein: Math.round(
      daysWithData.reduce((s, d) => s + d.protein, 0) / avgCount,
    ),
    carbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / avgCount),
    fat: Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / avgCount),
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    if (dateStr === today) return "Today";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div>
      {/* Seven-day averages: uses retoned MacroGrid for consistency with food log + nutrition tab. */}
      <section className="mb-8">
        <h3 className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-accent mb-3">
          Seven-day averages
        </h3>
        <MacroGrid values={averages} />
      </section>

      {/* Daily breakdown: card surface with rule dividers, mono tabular nums. */}
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
            {days.map((day) => {
              const empty = day.meals === 0;
              return (
                <tr
                  key={day.date}
                  className="border-b border-rule last:border-b-0"
                >
                  <td className="py-3 pr-4 font-sans text-sm font-medium text-ink">
                    {formatDate(day.date)}
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
