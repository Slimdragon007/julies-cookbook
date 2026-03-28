"use client";

import { useState, useEffect } from "react";
import { Loader2, BarChart3 } from "lucide-react";

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

      const byDate = new Map<string, { cal: number; p: number; c: number; f: number; count: number }>();

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

      summaries.sort((a, b) => b.date.localeCompare(a.date));
      setDays(summaries);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
      </div>
    );
  }

  const daysWithData = days.filter((d) => d.meals > 0);

  if (daysWithData.length === 0) {
    return (
      <div className="text-center py-24 glass rounded-[3rem]">
        <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-sky-100">
          <BarChart3 className="w-8 h-8 text-sky-200" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No data yet</h3>
        <p className="text-slate-500 max-w-xs mx-auto mb-6">
          Start logging your meals to see weekly nutrition trends and averages.
        </p>
        <a
          href="/log"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(0,166,244,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Log Your First Meal
        </a>
      </div>
    );
  }

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
      <div className="glass rounded-[2rem] px-6 py-5 mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          7-Day Averages
          {daysWithData.length === 0 && (
            <span className="text-slate-400 text-xs ml-2 font-medium">(no data yet)</span>
          )}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Calories", value: averages.calories, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Protein", value: `${averages.protein}g`, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Carbs", value: `${averages.carbs}g`, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Fat", value: `${averages.fat}g`, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="glass rounded-[2rem] px-6 py-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-400 text-xs">
              <th className="py-2.5 pr-4 font-bold">Day</th>
              <th className="py-2.5 px-2 font-bold text-right">Meals</th>
              <th className="py-2.5 px-2 font-bold text-right">Calories</th>
              <th className="py-2.5 px-2 font-bold text-right">Protein</th>
              <th className="py-2.5 px-2 font-bold text-right">Carbs</th>
              <th className="py-2.5 pl-2 font-bold text-right">Fat</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date} className="border-b border-slate-50">
                <td className="py-3 pr-4 text-slate-700 font-semibold">{formatDate(day.date)}</td>
                <td className="py-3 px-2 text-right text-slate-400 font-medium">{day.meals}</td>
                <td className="py-3 px-2 text-right text-slate-800 font-bold">{day.calories || "\u2014"}</td>
                <td className="py-3 px-2 text-right text-slate-500">{day.protein ? `${day.protein}g` : "\u2014"}</td>
                <td className="py-3 px-2 text-right text-slate-500">{day.carbs ? `${day.carbs}g` : "\u2014"}</td>
                <td className="py-3 pl-2 text-right text-slate-500">{day.fat ? `${day.fat}g` : "\u2014"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
