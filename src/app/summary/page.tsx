import WeeklySummary from "@/components/WeeklySummary";

export const metadata = {
  title: "Weekly Summary — Julie's Cookbook",
};

export default function SummaryPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-warm-dark mb-6">Weekly Summary</h1>
      <WeeklySummary />
    </div>
  );
}
