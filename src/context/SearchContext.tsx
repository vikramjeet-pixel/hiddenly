"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  isOverlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

const STORAGE_KEY = "nomadsecret_recent_searches";
const MAX_RECENT = 6;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecents);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const openOverlay = useCallback(() => setIsOverlayOpen(true), []);
  const closeOverlay = useCallback(() => setIsOverlayOpen(false), []);

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentSearches([]);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        isOverlayOpen,
        openOverlay,
        closeOverlay,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
