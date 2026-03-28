import { Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen pt-20 lg:pt-10 pb-32 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
          <Search className="w-8 h-8 text-amber-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Recipe not found</h2>
        <p className="text-slate-500 font-medium mb-8">
          This recipe may have been removed or the link might be wrong.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-bold shadow-[0_8px_24px_rgba(196,149,46,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Back to Recipes
        </Link>
      </div>
    </div>
  );
}
