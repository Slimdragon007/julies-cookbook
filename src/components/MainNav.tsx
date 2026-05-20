"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookHeart,
  PlusCircle,
  ShoppingBasket,
  UtensilsCrossed,
  BarChart3,
  MessageCircle,
  User,
} from "lucide-react";
import clsx from "clsx";
import ChatDrawer from "@/components/ChatDrawer";

// Add is in position 3 (center of 5)
const navItems = [
  { href: "/", icon: BookHeart, label: "Recipes" },
  { href: "/grocery-list", icon: ShoppingBasket, label: "Groceries" },
  { href: "/add-recipe", icon: PlusCircle, label: "Add" },
  { href: "/log", icon: UtensilsCrossed, label: "Log" },
  { href: "/summary", icon: BarChart3, label: "Summary" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/home";
  return pathname.startsWith(href);
}

export default function MainNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/recipe/");
  const fullBleed = hideNav;
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper flex flex-col relative pb-20 lg:pb-0 overflow-x-hidden selection:bg-accent-soft selection:text-accent-ink">
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex flex-col fixed left-4 top-4 bottom-4 w-20 xl:w-64 glass-strong rounded-3xl z-50">
        <div className="flex items-center gap-3 px-5 py-8 xl:px-8">
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lift">
            <BookHeart className="w-5 h-5 text-accent-on" />
          </div>
          <span className="hidden xl:block font-display text-[22px] text-ink leading-none">
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
                    ? "text-accent-ink bg-card border border-rule shadow-lift-sm"
                    : "text-ink-soft hover:text-ink hover:bg-card/60",
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                    active && "text-accent",
                  )}
                />
                <span className="hidden xl:block font-sans text-[14px] font-semibold">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="px-3 xl:px-4 pb-6 mt-auto border-t border-rule/60 pt-6 space-y-2">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-ink-soft hover:text-accent hover:bg-accent-soft transition-all w-full group"
          >
            <MessageCircle className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:block font-sans text-[14px] font-semibold">
              Kitchen line
            </span>
          </button>
          <Link
            href="/profile"
            className={clsx(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all w-full group",
              isActive(pathname, "/profile")
                ? "text-accent-ink bg-card border border-rule shadow-lift-sm"
                : "text-ink-soft hover:text-ink hover:bg-card/60",
            )}
          >
            <User className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:block font-sans text-[14px] font-semibold">
              Profile
            </span>
          </Link>
        </div>
      </nav>

      {/* Mobile top bar */}
      {!hideNav && (
        <div
          className="fixed top-0 left-0 right-0 lg:hidden z-40 bg-paper/95 backdrop-blur-2xl border-b border-rule shadow-[0_1px_3px_rgba(20,19,15,0.04)]"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex items-center justify-between max-w-lg mx-auto px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-lift-sm">
                <BookHeart className="w-4 h-4 text-accent-on" />
              </div>
              <span className="font-display text-[20px] text-ink leading-none">
                Cookbook
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatOpen(true)}
                aria-label="Open Kitchen line"
                className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent-ink hover:bg-accent hover:text-accent-on active:scale-95 transition-all"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </button>
              <Link
                href="/profile"
                className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-accent-on active:scale-95 transition-all"
                aria-label="Profile"
              >
                <User className="w-[16px] h-[16px]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 w-full min-w-0 lg:ml-28 xl:ml-72 transition-all duration-300">
        {fullBleed ? (
          children
        ) : (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </div>
        )}
      </main>

      {/* Mobile bottom nav — iOS-style tab bar */}
      {!hideNav && (
        <nav
          className="mobile-bottom-nav fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-paper/95 backdrop-blur-2xl border-t border-rule shadow-[0_-1px_3px_rgba(20,19,15,0.04)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}
        >
          <div className="px-2 pt-1.5 pb-1 w-full max-w-lg mx-auto flex items-end">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(pathname, href);

              if (href === "/add-recipe") {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex-1 min-w-0 flex flex-col items-center justify-center px-1 py-1 active:scale-95 transition-transform"
                  >
                    <div className="w-11 h-11 bg-accent rounded-[14px] flex items-center justify-center shadow-lift -mt-3 mb-0.5">
                      <PlusCircle className="w-6 h-6 text-accent-on" />
                    </div>
                    <span className="font-sans text-[10px] font-semibold text-accent">
                      Add
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex-1 min-w-0 flex flex-col items-center justify-center px-1 py-1 active:scale-95 transition-all",
                    active ? "text-accent" : "text-ink-mute",
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-[22px] h-[22px] mb-0.5",
                      active && "stroke-[2.5px]",
                    )}
                  />
                  <span
                    className={clsx(
                      "font-sans text-[10px]",
                      active ? "font-bold" : "font-medium",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
