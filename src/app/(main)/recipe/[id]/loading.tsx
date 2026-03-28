export default function RecipeLoading() {
  return (
    <div className="min-h-screen relative animate-pulse">
      <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:min-h-screen">
        {/* Image skeleton */}
        <div className="h-[50vh] lg:h-screen bg-slate-200/30" />

        {/* Content skeleton */}
        <div className="relative -mt-8 lg:mt-0 bg-white/60 rounded-t-[3rem] lg:rounded-none px-6 sm:px-10 pt-12 lg:pt-12 lg:pl-16 lg:pr-12 pb-32">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-1.5 bg-slate-200/50 rounded-full" />
          </div>

          {/* Title */}
          <div className="hidden lg:block mb-8">
            <div className="h-5 w-20 bg-amber-100 rounded-full mb-3" />
            <div className="h-12 w-3/4 bg-slate-200/50 rounded-2xl" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 rounded-3xl flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-100/50 rounded-2xl mb-2" />
                <div className="h-3 w-12 bg-slate-100/50 rounded mb-1" />
                <div className="h-4 w-16 bg-slate-200/50 rounded" />
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="glass rounded-2xl mb-8 p-1.5">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 h-10 bg-slate-100/30 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Ingredients skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass p-4 rounded-[1.5rem]">
                <div className="h-5 bg-slate-100/50 rounded-lg" style={{ width: `${60 + i * 5}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
