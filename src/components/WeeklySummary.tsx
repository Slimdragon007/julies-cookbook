"use client";

import { useState, useEffect } from "react";

interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

export default function WeeklySummary() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/log-meal?date=${today}&days=7`);
      const data = await res.json();

      if (!data.entries) {
        setLoading(false);
        return;
      }

      // Group entries by date
      const byDate = new Map<string, { cal: number; p: number; c: number; f: number; count: number }>();

      // Pre-fill last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        byDate.set(key, { cal: 0, p: 0, c: 0, f: 0, count: 0 });
      }

      for (const entry of data.entries) {
        const existing = byDate.get(entry.log_date) || { cal: 0, p: 0, c: 0, f: 0, count: 0 };
        existing.cal += entry.calories || 0;
        existing.p += entry.protein_g || 0;
        existing.c += entry.carbs_g || 0;
        existing.f += entry.fat_g || 0;
        existing.count += 1;
        byDate.set(entry.log_date, existing);
      }

      const summaries: DaySummary[] = [];
      byDate.forEach((vals, date) => {
        summaries.push({
          date,
          calories: vals.cal,
          protein: vals.p,
          carbs: vals.c,
          fat: vals.f,
          meals: vals.count,
        });
      });

      // Sort newest first
      summaries.sort((a, b) => b.date.localeCompare(a.date));
      setDays(summaries);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <p className="font-body text-sm text-warm-light">Loading...</p>;
  }

  const daysWithData = days.filter((d) => d.meals > 0);
  const avgCount = daysWithData.length || 1;
  const averages = {
    calories: Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / avgCount),
    protein: Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / avgCount),
    carbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / avgCount),
    fat: Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / avgCount),
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div>
      {/* 7-day averages */}
      <div className="bg-linen rounded-lg px-5 py-4 mb-6">
        <h3 className="font-display text-sm text-warm-dark mb-3">
          7-Day Averages
          {daysWithData.length === 0 && (
            <span className="text-warm-light font-body text-xs ml-2">(no data yet)</span>
          )}
        </h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="font-display text-lg text-warm-dark">{averages.calories}</div>
            <div className="text-xs text-warm-light">Calories</div>
          </div>
          <div>
            <div className="font-display text-lg text-warm-dark">{averages.protein}g</div>
            <div className="text-xs text-warm-light">Protein</div>
          </div>
          <div>
            <div className="font-display text-lg text-warm-dark">{averages.carbs}g</div>
            <div className="text-xs text-warm-light">Carbs</div>
          </div>
          <div>
            <div className="font-display text-lg text-warm-dark">{averages.fat}g</div>
            <div className="text-xs text-warm-light">Fat</div>
          </div>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left text-warm-light text-xs">
              <th className="py-2.5 pr-4 font-normal">Day</th>
              <th className="py-2.5 px-2 font-normal text-right">Meals</th>
              <th className="py-2.5 px-2 font-normal text-right">Calories</th>
              <th className="py-2.5 px-2 font-normal text-right">Protein</th>
              <th className="py-2.5 px-2 font-normal text-right">Carbs</th>
              <th className="py-2.5 pl-2 font-normal text-right">Fat</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-border/30">
                <td className="py-2.5 pr-4 text-warm-dark">{formatDate(day.date)}</td>
                <td className="py-2.5 px-2 text-right text-warm-light">{day.meals}</td>
                <td className="py-2.5 px-2 text-right text-warm-dark">{day.calories || "\u2014"}</td>
                <td className="py-2.5 px-2 text-right text-warm-light">{day.protein ? `${day.protein}g` : "\u2014"}</td>
                <td className="py-2.5 px-2 text-right text-warm-light">{day.carbs ? `${day.carbs}g` : "\u2014"}</td>
                <td className="py-2.5 pl-2 text-right text-warm-light">{day.fat ? `${day.fat}g` : "\u2014"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
