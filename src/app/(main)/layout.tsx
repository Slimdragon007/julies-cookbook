import MainNav from "@/components/MainNav";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainNav>{children}</MainNav>;
}
