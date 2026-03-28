import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo — Julie's Cookbook",
  description: "See how Julie's Cookbook works — interactive 4-step demo",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
