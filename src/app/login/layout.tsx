import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Julie's Cookbook",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
