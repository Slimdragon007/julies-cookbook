import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.variable} font-body antialiased text-slate-800 bg-[#FDFCFB]`}>
        <div className="ambient-bg">
          <div className="grid-overlay" />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
