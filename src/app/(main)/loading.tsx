export default function HomeLoading() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 animate-pulse">
      {/* Header skeleton */}
      <header className="mb-10 px-2">
        <div className="h-9 w-48 bg-slate-200/50 rounded-2xl mb-3" />
        <div className="h-5 w-64 bg-slate-100/50 rounded-xl" />
      </header>

      {/* Section header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="h-6 w-32 bg-slate-200/50 rounded-xl" />
        <div className="h-5 w-20 bg-slate-100/50 rounded-xl" />
      </div>

      {/* Recipe grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-[2.5rem] overflow-hidden">
            <div className="h-64 bg-slate-200/30" />
            <div className="p-6 pt-5">
              <div className="h-6 w-3/4 bg-slate-200/50 rounded-xl mb-4" />
              <div className="flex gap-6">
                <div className="h-4 w-24 bg-slate-100/50 rounded-lg" />
                <div className="h-4 w-16 bg-slate-100/50 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
