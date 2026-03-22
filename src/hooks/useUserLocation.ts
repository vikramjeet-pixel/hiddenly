"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Coords {
  lat: number;
  lng: number;
}

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export interface UserLocationState {
  coords: Coords | null;
  error: string | null;
  loading: boolean;
  permissionStatus: PermissionStatus;
  requestLocation: () => void;
  clearError: () => void;
}

// ── Error code → friendly message mapping ─────────────────────────────────────

function mapPositionError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location access denied. Please enable it in your browser settings.";
    case err.POSITION_UNAVAILABLE:
      return "Your position is currently unavailable. Try again later.";
    case err.TIMEOUT:
      return "Location request timed out. Check your connection and try again.";
    default:
      return "An unknown error occurred while fetching your location.";
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUserLocation(): UserLocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");

  // We keep a ref to the watch ID so we can cleanly cancel it on unmount
  const watchIdRef = useRef<number | null>(null);
  // Track whether the component is still mounted
  const mountedRef = useRef(true);

  // ── 1. Initialise permission status on mount ────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === "undefined" || !navigator.geolocation) {
      setPermissionStatus("unsupported");
      return;
    }

    // Use the Permissions API if available, with a graceful fallback
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (!mountedRef.current) return;

          setPermissionStatus(result.state as PermissionStatus);

          // Live-update if the user changes permission in browser settings
          result.onchange = () => {
            if (!mountedRef.current) return;
            setPermissionStatus(result.state as PermissionStatus);

            // If they just granted access, fetch coordinates immediately
            if (result.state === "granted") {
              fetchCurrentPosition();
            }
            // If they revoked, clear cached coords
            if (result.state === "denied") {
              setCoords(null);
            }
          };
        })
        .catch(() => {
          // Permissions API not supported in this browser — default to prompt
          if (mountedRef.current) setPermissionStatus("prompt");
        });
    }

    return () => {
      mountedRef.current = false;
      // Clear any active watchPosition
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Internal position fetcher ───────────────────────────────────────────
  const fetchCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionStatus("unsupported");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setPermissionStatus("granted");
        setLoading(false);
      },
      (err) => {
        if (!mountedRef.current) return;
        setError(mapPositionError(err));
        setPermissionStatus(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,        // 10 s before giving up
        maximumAge: 60_000,     // Accept a cached position up to 1 min old
      }
    );
  }, []);

  // ── 3. Public requestLocation function ────────────────────────────────────
  const requestLocation = useCallback(() => {
    fetchCurrentPosition();
  }, [fetchCurrentPosition]);

  // ── 4. Helpers ────────────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  return {
    coords,
    error,
    loading,
    permissionStatus,
    requestLocation,
    clearError,
  };
}
