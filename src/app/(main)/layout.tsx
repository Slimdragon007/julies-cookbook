import MainNav from "@/components/MainNav";
import { MeasurementSystemProvider } from "@/lib/measurement-system";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MeasurementSystemProvider>
      <MainNav>{children}</MainNav>
    </MeasurementSystemProvider>
  );
}
