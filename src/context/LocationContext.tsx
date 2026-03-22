"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUserLocation, type Coords, type PermissionStatus } from "@/hooks/useUserLocation";

// ── Context Shape ─────────────────────────────────────────────────────────────

interface LocationContextValue {
  /** Current user coordinates, or null if not yet obtained */
  coords: Coords | null;
  /** Whether a location request is in flight */
  loading: boolean;
  /** Friendly error string, or null */
  error: string | null;
  /** 'granted' | 'denied' | 'prompt' | 'unsupported' */
  permissionStatus: PermissionStatus;
  /** Call this to ask the browser for the user's location */
  requestLocation: () => void;
  /** Clear the error state */
  clearError: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function LocationProvider({ children }: { children: ReactNode }) {
  const location = useUserLocation();

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a <LocationProvider>");
  }
  return ctx;
}
