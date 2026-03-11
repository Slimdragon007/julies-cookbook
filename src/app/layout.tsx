import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import ChatFAB from "@/components/ChatFAB";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Julie's Cookbook",
  description: "A beautiful cookbook app for Julie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lora.variable} font-body antialiased`}>
        <header className="border-b border-border bg-cream">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="text-center">
              <a href="/" className="inline-block">
                <h1 className="font-display text-3xl md:text-4xl text-warm-dark tracking-tight">
                  Julie&apos;s Cookbook
                </h1>
                <p className="text-warm-light text-sm mt-1 font-body">
                  Simple recipes, made with love
                </p>
              </a>
            </div>
            <nav className="flex justify-center gap-6 mt-3">
              <a href="/" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
                Recipes
              </a>
              <a href="/grocery-list" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
                Grocery List
              </a>
              <a href="/add-recipe" className="font-body text-sm text-warm hover:text-warm-dark transition-colors">
                Add Recipe
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <ChatFAB />
        <Analytics />
      </body>
    </html>
  );
}
