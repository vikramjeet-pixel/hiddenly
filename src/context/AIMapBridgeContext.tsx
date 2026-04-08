"use client";

/**
 * AIMapBridgeContext
 *
 * A lightweight global store that bridges the AI Search page
 * with the interactive Map on the home page.
 *
 * Flow:
 *   1. User gets AI results on /ai-search
 *   2. Clicks "Update Map" → pushes gems here + sets scanning = true
 *   3. Home page (/) reads bridge, switches to Map view, shows carousel + scanning pulse
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BridgeGem {
  id: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
}

interface AIMapBridgeState {
  /** Gems pushed from AI search */
  gems: BridgeGem[];
  /** True while the AI is thinking (scanning pulse on map) */
  scanning: boolean;
  /** Index of the currently focused carousel card */
  focusedIndex: number;
  /** The vibe query label shown on the map overlay */
  vibeLabel: string;
}

interface AIMapBridgeContextValue extends AIMapBridgeState {
  pushGems: (gems: BridgeGem[], vibeLabel: string) => void;
  setScanning: (v: boolean) => void;
  setFocusedIndex: (i: number) => void;
  clearBridge: () => void;
}

const AIMapBridgeContext = createContext<AIMapBridgeContextValue | null>(null);

export function AIMapBridgeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIMapBridgeState>({
    gems: [],
    scanning: false,
    focusedIndex: 0,
    vibeLabel: "",
  });

  const pushGems = useCallback((gems: BridgeGem[], vibeLabel: string) => {
    setState({ gems, scanning: false, focusedIndex: 0, vibeLabel });
  }, []);

  const setScanning = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, scanning: v }));
  }, []);

  const setFocusedIndex = useCallback((i: number) => {
    setState((prev) => ({ ...prev, focusedIndex: i }));
  }, []);

  const clearBridge = useCallback(() => {
    setState({ gems: [], scanning: false, focusedIndex: 0, vibeLabel: "" });
  }, []);

  return (
    <AIMapBridgeContext.Provider value={{ ...state, pushGems, setScanning, setFocusedIndex, clearBridge }}>
      {children}
    </AIMapBridgeContext.Provider>
  );
}

export function useAIMapBridge(): AIMapBridgeContextValue {
  const ctx = useContext(AIMapBridgeContext);
  if (!ctx) throw new Error("useAIMapBridge must be used inside <AIMapBridgeProvider>");
  return ctx;
}
