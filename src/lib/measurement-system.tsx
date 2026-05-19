"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { MeasurementSystem } from "@/lib/unit-conversions";

export type { MeasurementSystem };

const STORAGE_KEY = "julies-cookbook:measurement-system";
const DEFAULT_SYSTEM: MeasurementSystem = "imperial";

interface MeasurementSystemContextValue {
  system: MeasurementSystem;
  setSystem: (s: MeasurementSystem) => void;
  toggle: () => void;
}

const MeasurementSystemContext =
  createContext<MeasurementSystemContextValue | null>(null);

function readStored(): MeasurementSystem {
  if (typeof window === "undefined") return DEFAULT_SYSTEM;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "metric" || v === "imperial" ? v : DEFAULT_SYSTEM;
  } catch {
    // Private browsing or storage disabled — fall back silently.
    return DEFAULT_SYSTEM;
  }
}

export function MeasurementSystemProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Lazy init keeps SSR + first client render in sync (both return DEFAULT_SYSTEM);
  // the effect below hydrates from localStorage after mount.
  const [system, setSystemState] = useState<MeasurementSystem>(DEFAULT_SYSTEM);

  useEffect(() => {
    setSystemState(readStored());
  }, []);

  const setSystem = useCallback((next: MeasurementSystem) => {
    setSystemState(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — best-effort persistence.
    }
  }, []);

  const toggle = useCallback(() => {
    setSystem(system === "imperial" ? "metric" : "imperial");
  }, [system, setSystem]);

  return (
    <MeasurementSystemContext.Provider value={{ system, setSystem, toggle }}>
      {children}
    </MeasurementSystemContext.Provider>
  );
}

export function useMeasurementSystem(): MeasurementSystemContextValue {
  const ctx = useContext(MeasurementSystemContext);
  if (!ctx) {
    throw new Error(
      "useMeasurementSystem must be used within a MeasurementSystemProvider",
    );
  }
  return ctx;
}
