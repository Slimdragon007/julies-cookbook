"use client";

// TASK-026 PR C: settings UI for the tweaks panel.
//
// Reads preferences from the TweaksProvider context (mounted in
// (main)/layout.tsx) and writes through setPreference on every selection.
// Optimistic updates flip the data-* attribute on the wrapper div
// immediately; Supabase upsert lands in the background.
//
// Layout: four labeled control groups (Voice / Imagery / Paper / Palette),
// each rendered as a row of choice tiles. Active tile uses bg-accent,
// inactive uses bg-card border-rule. Same visual pattern as the
// MeasurementToggle but expanded for multi-option selection.

import { useEffect, useRef, useState } from "react";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { useTweaks } from "@/components/TweaksProvider";
import {
  type Preferences,
  type Voice,
  type Imagery,
  type Paper,
  type Palette,
  VOICE_VALUES,
  IMAGERY_VALUES,
  PAPER_VALUES,
  PALETTE_VALUES,
} from "@/lib/preferences-contract";
import { cn } from "@/lib/utils";

const VOICE_LABELS: Record<Voice, string> = {
  editorial: "Editorial",
  notebook: "Notebook",
  studio: "Studio",
};

const VOICE_HINTS: Record<Voice, string> = {
  editorial: "Instrument Serif italic + Inter (default)",
  notebook: "Caveat + Lora, handwritten warmth",
  studio: "Space Grotesk, geometric and clean",
};

const IMAGERY_LABELS: Record<Imagery, string> = {
  photographic: "Photographic",
  filmic: "Filmic",
  mono: "Mono",
};

const IMAGERY_HINTS: Record<Imagery, string> = {
  photographic: "Natural color, no filter (default)",
  filmic: "Low-contrast, warm sepia wash",
  mono: "Grayscale, high contrast",
};

const PAPER_LABELS: Record<Paper, string> = {
  smooth: "Smooth",
  linen: "Linen",
  newsprint: "Newsprint",
};

const PAPER_HINTS: Record<Paper, string> = {
  smooth: "No texture (default)",
  linen: "Soft woven grain",
  newsprint: "Coarse pulp grain",
};

const PALETTE_LABELS: Record<Palette, string> = {
  paper: "Paper",
  "bone & sage": "Bone & Sage",
  ink: "Ink",
  "terra wash": "Terra Wash",
};

const PALETTE_HINTS: Record<Palette, string> = {
  paper: "Terracotta on warm paper (default)",
  "bone & sage": "Sage green accent",
  ink: "Dark mode, amber accent",
  "terra wash": "Burnt sienna accent",
};

type SavingState = "idle" | "saving" | "saved" | "error";

interface ChoiceRowProps<T extends string> {
  legend: string;
  description: string;
  values: readonly T[];
  labels: Record<T, string>;
  hints: Record<T, string>;
  active: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}

function ChoiceRow<T extends string>({
  legend,
  description,
  values,
  labels,
  hints,
  active,
  onChange,
  disabled,
}: ChoiceRowProps<T>) {
  return (
    <fieldset className="bg-card border border-rule rounded p-6 shadow-lift-sm">
      <legend className="px-2 -ml-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
        {legend}
      </legend>
      <p className="font-sans text-sm text-ink-soft mb-4">{description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {values.map((value) => {
          const isActive = value === active;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-pressed={isActive}
              disabled={disabled}
              className={cn(
                "text-left rounded border p-3 transition-all duration-200 ease-hearth",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "bg-accent text-accent-on border-accent shadow-lift-sm"
                  : "bg-paper border-rule text-ink hover:border-accent/40 hover:shadow-lift-sm",
              )}
            >
              <div className="font-sans text-[14px] font-semibold leading-tight">
                {labels[value]}
              </div>
              <div
                className={cn(
                  "font-sans text-[11px] mt-1 leading-snug",
                  isActive ? "text-accent-on/85" : "text-ink-mute",
                )}
              >
                {hints[value]}
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function SettingsForm() {
  const { preferences, setPreference } = useTweaks();
  const [savingFor, setSavingFor] = useState<keyof Preferences | null>(null);
  const [state, setState] = useState<SavingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  async function pick<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) {
    if (preferences[key] === value) return;
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setSavingFor(key);
    setState("saving");
    setErrorMessage(null);
    const result = await setPreference(key, value);
    setSavingFor(null);
    if (result.ok) {
      setState("saved");
      resetTimerRef.current = setTimeout(() => {
        setState("idle");
        resetTimerRef.current = null;
      }, 1600);
    } else {
      setState("error");
      setErrorMessage(result.error ?? "Couldn't save. Try again.");
    }
  }

  return (
    <div>
      <header className="mb-8 px-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent-soft text-accent-ink rounded-full flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <span className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-accent">
            Tweaks
          </span>
        </div>
        <h1 className="font-display text-[40px] sm:text-[52px] text-ink leading-[1.05] mb-1">
          Settings
        </h1>
        <p className="font-sans text-base text-ink-soft">
          Tune how the cookbook looks and feels. Changes sync across every
          device you sign in on.
        </p>
        <div
          aria-live="polite"
          className="mt-4 min-h-[1.25rem] font-sans text-sm"
        >
          {state === "saving" && (
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving {savingFor}…
            </span>
          )}
          {state === "saved" && <span className="text-accent">Saved.</span>}
          {state === "error" && (
            <span className="text-accent-ink">
              {errorMessage ?? "Couldn't save. Try again."}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6">
        <ChoiceRow
          legend="Voice"
          description="The typography Julie reads in. Recipe titles + section headers + body."
          values={VOICE_VALUES}
          labels={VOICE_LABELS}
          hints={VOICE_HINTS}
          active={preferences.voice}
          onChange={(v) => pick("voice", v)}
          disabled={savingFor !== null}
        />

        <ChoiceRow
          legend="Imagery"
          description="Filter applied to every recipe photo."
          values={IMAGERY_VALUES}
          labels={IMAGERY_LABELS}
          hints={IMAGERY_HINTS}
          active={preferences.imagery}
          onChange={(v) => pick("imagery", v)}
          disabled={savingFor !== null}
        />

        <ChoiceRow
          legend="Paper"
          description="Surface texture beneath the editorial."
          values={PAPER_VALUES}
          labels={PAPER_LABELS}
          hints={PAPER_HINTS}
          active={preferences.paper}
          onChange={(v) => pick("paper", v)}
          disabled={savingFor !== null}
        />

        <ChoiceRow
          legend="Palette"
          description="Color system the whole app inherits from."
          values={PALETTE_VALUES}
          labels={PALETTE_LABELS}
          hints={PALETTE_HINTS}
          active={preferences.palette}
          onChange={(v) => pick("palette", v)}
          disabled={savingFor !== null}
        />
      </div>

      <p className="font-sans text-xs text-ink-mute italic mt-8 px-1">
        Preferences stored per-user in Supabase. The defaults render the same as
        before you ever touched this page, so reverting any choice rolls back
        its effect.
      </p>
    </div>
  );
}
