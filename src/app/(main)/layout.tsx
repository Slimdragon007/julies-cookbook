import MainNav from "@/components/MainNav";
import { MeasurementSystemProvider } from "@/lib/measurement-system";
import { TweaksProvider } from "@/components/TweaksProvider";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getPreferences, DEFAULT_PREFERENCES } from "@/lib/preferences";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side preference fetch. Pre-auth surfaces (login/signup/demo) do
  // not sit inside this layout, so we can assume an authenticated user here;
  // the null fallback is defensive only.
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const preferences = user
    ? await getPreferences(user.id)
    : DEFAULT_PREFERENCES;

  return (
    <TweaksProvider initial={preferences} userId={user?.id ?? null}>
      <MeasurementSystemProvider>
        <MainNav>{children}</MainNav>
      </MeasurementSystemProvider>
    </TweaksProvider>
  );
}
