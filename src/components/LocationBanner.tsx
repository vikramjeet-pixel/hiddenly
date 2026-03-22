"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, X, AlertCircle, Navigation } from "lucide-react";
import { useLocation } from "@/context/LocationContext";

/**
 * LocationBanner
 * ──────────────
 * Appears automatically when 'permissionStatus === "prompt"' — i.e. the user
 * hasn't decided yet whether to share their location.
 *
 * On success → banner dismisses itself.
 * On error   → shows the friendly error inline with a retry button.
 * If denied  → transitions to a subtle "denied" notice with settings hint.
 *
 * Place this inside the main feed column (page.tsx) so it sits inline
 * above the discovery cards, or anywhere in the component tree.
 */
export default function LocationBanner() {
  const { permissionStatus, loading, error, requestLocation, clearError } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Hide entirely if already granted, dismissed, or unsupported
  const shouldRender =
    !dismissed &&
    (permissionStatus === "prompt" ||
     permissionStatus === "denied" ||
     !!error);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="location-banner"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full rounded-2xl overflow-hidden mb-4"
        >
          {/* ── Gradient background ────────────────────────────── */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-amber-50 to-orange-50 dark:from-primary/20 dark:via-neutral-900 dark:to-neutral-900 pointer-events-none" />
          <div className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none" />

          <div className="relative px-4 py-3.5 flex items-center gap-3">

            {/* Icon area */}
            <div className="shrink-0">
              {loading ? (
                <Loader2 className="size-5 text-primary animate-spin" />
              ) : error || permissionStatus === "denied" ? (
                <AlertCircle className="size-5 text-amber-500" />
              ) : (
                <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <MapPin className="size-4 text-primary" />
                </div>
              )}
            </div>

            {/* Text + CTA */}
            <div className="flex-1 min-w-0">
              {/* ── Error state ── */}
              {error ? (
                <>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-snug">
                    {error}
                  </p>
                  {permissionStatus !== "denied" && (
                    <button
                      onClick={() => { clearError(); requestLocation(); }}
                      className="mt-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Try again
                    </button>
                  )}
                  {permissionStatus === "denied" && (
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      Open your browser settings to re-enable location access.
                    </p>
                  )}
                </>
              ) : (
                /* ── Prompt state ── */
                <>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100 leading-snug">
                    Find gems near your current location.
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    We never store or share your location.
                  </p>
                </>
              )}
            </div>

            {/* Action button (right side) */}
            {!error && !loading && permissionStatus === "prompt" && (
              <button
                id="location-enable-btn"
                onClick={requestLocation}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold hover:bg-primary/85 active:scale-95 transition-all shadow-sm shadow-primary/25"
              >
                <Navigation className="size-3" />
                Enable
              </button>
            )}

            {/* Dismiss × */}
            <button
              onClick={() => { setDismissed(true); clearError(); }}
              className="shrink-0 size-6 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-600 transition-colors ml-1"
              aria-label="Dismiss location banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
