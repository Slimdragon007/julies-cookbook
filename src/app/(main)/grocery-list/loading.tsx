export default function GroceryLoading() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 animate-pulse">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-slate-200/30 rounded-2xl" />
            <div className="h-8 w-40 bg-slate-200/50 rounded-2xl" />
          </div>
          <div className="h-5 w-64 bg-slate-100/50 rounded-xl mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass rounded-[1.75rem] p-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-100/50 rounded-xl" />
                <div className="w-10 h-10 bg-slate-200/30 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-slate-200/50 rounded-lg mb-1" />
                  <div className="h-3 w-1/2 bg-slate-100/50 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
