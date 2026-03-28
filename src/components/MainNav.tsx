"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookHeart, PlusCircle, ShoppingBasket, UtensilsCrossed, BarChart3 } from "lucide-react";
import clsx from "clsx";
import ChatFAB from "@/components/ChatFAB";
import SignOutButton from "@/components/SignOutButton";

const navItems = [
  { href: "/", icon: BookHeart, label: "Recipes" },
  { href: "/add-recipe", icon: PlusCircle, label: "Add" },
  { href: "/grocery-list", icon: ShoppingBasket, label: "Groceries" },
  { href: "/log", icon: UtensilsCrossed, label: "Log" },
  { href: "/summary", icon: BarChart3, label: "Summary" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/home";
  return pathname.startsWith(href);
}

export default function MainNav({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/recipe/");

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col relative pb-20 lg:pb-0 overflow-x-hidden selection:bg-sky-100 selection:text-sky-900">
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 w-20 xl:w-64 glass-strong rounded-3xl z-50">
        <div className="flex items-center gap-3 px-5 py-8 xl:px-8">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200/50">
            <BookHeart className="w-5 h-5 text-white" />
          </div>
          <span className="hidden xl:block text-[18px] font-bold text-slate-800 tracking-tight">
            Cookbook
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-2 px-3 xl:px-4 mt-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative group",
                  active
                    ? "text-sky-700 bg-white/60 border border-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                )}
              >
                <Icon className={clsx("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", active && "text-sky-600")} />
                <span className="hidden xl:block text-[14px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-3 xl:px-4 pb-6 mt-auto border-t border-slate-100/50 pt-6">
          <SignOutButton />
        </div>
      </nav>

      {/* Mobile top bar */}
      {!hideNav && (
        <div className="fixed top-0 left-0 right-0 lg:hidden z-40 px-6 pt-[env(safe-area-inset-top,0px)] bg-[#FDFCFB]/90 backdrop-blur-xl border-b border-white/40">
          <div className="flex items-center justify-between max-w-lg mx-auto py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-200">
                <BookHeart className="w-4 h-4 text-white" />
              </div>
              <span className="text-[16px] font-bold text-slate-800 tracking-tight">Cookbook</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 w-full lg:ml-28 xl:ml-72 transition-all duration-300">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — all 5 items */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50 pb-[env(safe-area-inset-bottom,8px)] bg-[#FDFCFB]/90 backdrop-blur-xl border-t border-white/40">
          <div className="px-4 pt-2 pb-1 w-full max-w-md mx-auto flex justify-around items-center">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(pathname, href);

              // Elevated "Add" button in center
              if (href === "/add-recipe") {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center justify-center w-12 py-1.5 rounded-xl transition-all relative active:scale-90 text-sky-500"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-md shadow-sky-200/50">
                      <PlusCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[9px] font-semibold tracking-wide mt-0.5">Add</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex flex-col items-center justify-center w-12 py-1.5 rounded-xl transition-all relative",
                    active ? "text-sky-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {active && (
                    <div className="absolute inset-0 bg-white/60 rounded-xl border border-white shadow-sm" />
                  )}
                  <Icon className="w-5 h-5 mb-0.5 relative z-10" />
                  <span className="text-[9px] font-semibold tracking-wide relative z-10">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <ChatFAB />
    </div>
  );
}
