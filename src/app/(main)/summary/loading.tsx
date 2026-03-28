export default function SummaryLoading() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 animate-pulse">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-200/30 rounded-2xl" />
          <div className="h-8 w-44 bg-slate-200/50 rounded-2xl" />
        </div>

        {/* Averages skeleton */}
        <div className="glass rounded-[2rem] px-6 py-5 mb-8">
          <div className="h-4 w-28 bg-slate-100/50 rounded mb-4" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center">
                <div className="h-6 w-10 bg-slate-200/50 rounded mx-auto mb-1" />
                <div className="h-3 w-12 bg-slate-100/50 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="glass rounded-[2rem] px-6 py-5">
          <div className="h-4 w-32 bg-slate-100/50 rounded mb-4" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-slate-50">
              <div className="h-4 w-24 bg-slate-100/50 rounded" />
              <div className="h-4 w-16 bg-slate-100/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
