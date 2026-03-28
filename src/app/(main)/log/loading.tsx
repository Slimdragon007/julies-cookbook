export default function LogLoading() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 animate-pulse">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-200/30 rounded-2xl" />
          <div className="h-8 w-32 bg-slate-200/50 rounded-2xl" />
        </div>

        {/* Form skeleton */}
        <div className="glass-strong rounded-[2rem] p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-slate-100/50 rounded" />
                <div className="h-14 bg-slate-100/30 rounded-2xl" />
              </div>
            ))}
          </div>
          <div className="h-12 w-32 bg-slate-200/50 rounded-2xl" />
        </div>

        {/* Entries skeleton */}
        <div className="h-6 w-20 bg-slate-200/50 rounded-xl mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass p-5 rounded-[1.75rem]">
              <div className="flex justify-between">
                <div className="h-5 w-40 bg-slate-100/50 rounded-lg" />
                <div className="h-5 w-20 bg-slate-100/50 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
