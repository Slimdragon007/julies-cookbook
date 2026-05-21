"use client";

// TASK-026 PR B: React context provider for the tweaks panel.
//
// The (main)/layout.tsx server component fetches preferences and passes them
// in as `initial`. The provider hydrates a state setter for client-side
// updates, persists changes to Supabase, and renders a wrapper div whose
// data-* attributes drive the CSS variable overrides in globals.css.
//
// The wrapper div (not <html>) is the data-* root so pre-auth surfaces
// (login/signup/demo) stay on the CSS defaults — they're outside the (main)
// layout that wraps with this provider.
//
// PR C wires the actual /settings UI to the setter exposed via useTweaks().

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { setPreferences, type Preferences } from "@/lib/preferences";

interface TweaksContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => Promise<{ ok: boolean; error?: string }>;
}

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) {
    throw new Error("useTweaks must be called inside <TweaksProvider>");
  }
  return ctx;
}

interface TweaksProviderProps {
  initial: Preferences;
  userId: string | null;
  children: ReactNode;
}

export function TweaksProvider({
  initial,
  userId,
  children,
}: TweaksProviderProps) {
  const [preferences, setLocal] = useState<Preferences>(initial);

  const setPreference = useCallback<TweaksContextValue["setPreference"]>(
    async (key, value) => {
      // Optimistic update via functional setter so two quick calls before a
      // re-render can't drop each other's changes. We capture the prior
      // value-for-this-key from inside the setter so a failure rolls back
      // only the column we wrote, not the whole snapshot.
      let prevValueForKey: Preferences[typeof key] | undefined;
      setLocal((current) => {
        prevValueForKey = current[key];
        return { ...current, [key]: value };
      });

      if (!userId) {
        // No user (shouldn't happen inside (main)/layout.tsx, but defend the
        // boundary anyway). Optimistic state holds locally for the session.
        return { ok: true };
      }

      const result = await setPreferences(userId, { [key]: value });
      if (!result.ok && prevValueForKey !== undefined) {
        // Roll back only this key, preserving any other in-flight updates.
        setLocal((current) => ({ ...current, [key]: prevValueForKey! }));
      }
      return result;
    },
    [userId],
  );

  return (
    <TweaksContext.Provider value={{ preferences, setPreference }}>
      <div
        className="contents"
        data-voice={preferences.voice}
        data-imagery={preferences.imagery}
        data-paper={preferences.paper}
        data-palette={preferences.palette}
      >
        {children}
      </div>
    </TweaksContext.Provider>
  );
}
