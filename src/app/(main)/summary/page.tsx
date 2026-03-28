import WeeklySummary from "@/components/WeeklySummary";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Weekly Summary — Julie's Cookbook",
};

export default function SummaryPage() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center shadow-sm">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Weekly Summary</h1>
        </div>
        <WeeklySummary />
      </div>
    </div>
  );
}
