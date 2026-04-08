"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import mapStyles from "@/lib/map-styles.json";
import { BridgeGem } from "@/context/AIMapBridgeContext";
import { Sparkles, Loader2 } from "lucide-react";

interface MapViewProps {
  gems: any[];
  /** AI-curated gems to highlight on the map */
  aiGems?: BridgeGem[];
  /** Index of the currently focused AI gem (triggers pan) */
  focusedAIGem?: BridgeGem | null;
  /** Shows an animated scanning pulse overlay */
  isScanning?: boolean;
  /** Vibe label shown as overlay tag when AI gems are displayed */
  vibeLabel?: string;
}

export default function MapView({
  gems,
  aiGems,
  focusedAIGem,
  isScanning = false,
  vibeLabel,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const aiMarkersRef = useRef<any[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]);
  const isInitialized = useRef(false);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized.current || !mapRef.current) return;
    isInitialized.current = true;

    const initMap = async () => {
      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        v: "weekly",
      });

      try {
        const { Map } = (await importLibrary("maps")) as any;
        const map = new Map(mapRef.current!, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: "greedy",
          mapId: "DEMO_MAP_ID",
          backgroundColor: "#17263c",
        });
        setMapInstance(map);
      } catch (err) {
        console.error("Failed to load Google Maps SDK:", err);
      }
    };

    initMap();
  }, []);

  // ── Sync regular gem markers ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance) return;

    const syncMarkers = async () => {
      if (clustererRef.current) clustererRef.current.clearMarkers();
      markersRef.current.forEach((m) => { m.map = null; });
      markersRef.current = [];

      try {
        const { AdvancedMarkerElement, PinElement } = (await importLibrary("marker")) as any;

        const newMarkers = gems
          .filter((gem) => gem.latitude && gem.longitude)
          .map((gem) => {
            const lat = parseFloat(gem.latitude);
            const lng = parseFloat(gem.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const contentDiv = document.createElement("div");
            contentDiv.className =
              "flex flex-col gap-2 min-w-[160px] p-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]";
            contentDiv.innerHTML = `
              ${gem.media && gem.media[0] ? `<img src="${gem.media[0]}" class="w-full h-24 object-cover rounded-lg bg-black/50" alt="${gem.title || "Gem"}" />` : ""}
              <div class="px-1 py-0.5 flex flex-col">
                <span class="text-xs font-serif font-black italic text-white leading-tight truncate w-32">${gem.title}</span>
                <span class="text-[9px] text-primary font-bold uppercase tracking-widest mt-0.5 opacity-80 flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">location_on</span>${gem.locationName || gem.city || "Unknown"}</span>
              </div>
            `;

            const pin = new PinElement({
              background: "#000000",
              borderColor: "#ec5b13",
              glyphColor: "#ec5b13",
              scale: 1.1,
            });

            const marker = new AdvancedMarkerElement({
              map: mapInstance,
              position: { lat, lng },
              content: pin.element,
              title: gem.title,
            });

            let infoWindow: any;
            marker.addListener("click", async () => {
              const { InfoWindow } = (await importLibrary("maps")) as any;
              if (infoWindow) infoWindow.close();
              infoWindow = new InfoWindow({
                content: contentDiv,
                headerDisabled: true,
                minWidth: 160,
              });
              infoWindow.open({ anchor: marker, map: mapInstance });
            });

            return marker;
          })
          .filter(Boolean);

        markersRef.current = newMarkers;
        clustererRef.current = new MarkerClusterer({ map: mapInstance, markers: newMarkers });
      } catch (e) {
        console.error("Advanced Marker injection failed:", e);
      }
    };

    syncMarkers();
  }, [gems, mapInstance]);

  // ── Sync AI gem highlight markers ──────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance) return;

    const syncAIMarkers = async () => {
      aiMarkersRef.current.forEach((m) => { m.map = null; });
      aiMarkersRef.current = [];

      if (!aiGems || aiGems.length === 0) return;

      try {
        const { AdvancedMarkerElement } = (await importLibrary("marker")) as any;

        const newMarkers = aiGems
          .filter((g) => g.lat && g.lng)
          .map((g, i) => {
            // Glowing AI pin
            const el = document.createElement("div");
            el.className = "relative flex items-center justify-center";
            el.innerHTML = `
              <div class="absolute w-10 h-10 rounded-full bg-orange-400/30 animate-ping" style="animation-duration:2s"></div>
              <div class="relative w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
                ${i + 1}
              </div>
            `;

            const marker = new AdvancedMarkerElement({
              map: mapInstance,
              position: { lat: g.lat!, lng: g.lng! },
              content: el,
              title: g.title,
            });
            return marker;
          });

        aiMarkersRef.current = newMarkers;
      } catch (e) {
        console.error("AI marker error:", e);
      }
    };

    syncAIMarkers();
  }, [aiGems, mapInstance]);

  // ── Pan to focused AI gem with smooth animation ────────────────────────────
  useEffect(() => {
    if (!mapInstance || !focusedAIGem?.lat || !focusedAIGem?.lng) return;

    const target = { lat: focusedAIGem.lat, lng: focusedAIGem.lng };

    // Step 1: zoom out slightly for cinematic feel
    mapInstance.panTo(target);

    setTimeout(() => {
      mapInstance.setZoom(14);
    }, 300);

    setTimeout(() => {
      mapInstance.panTo(target);
    }, 600);
  }, [focusedAIGem, mapInstance]);

  return useMemo(
    () => (
      <div className="w-full h-[calc(100dvh-190px)] md:h-[calc(100vh-180px)] rounded-3xl md:rounded-[2rem] overflow-hidden border border-neutral-200 shadow-lg md:shadow-2xl relative bg-neutral-900 animate-in fade-in duration-500 zoom-in-95">
        {/* Map canvas */}
        <div ref={mapRef} className="w-full h-full" />

        {/* ── Scanning Pulse Overlay ── */}
        {isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            {/* Ripple rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full border-2 border-orange-400/60 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="absolute w-52 h-52 rounded-full border border-orange-400/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
              <div className="absolute w-72 h-72 rounded-full border border-orange-400/15 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.6s" }} />
              <div className="w-14 h-14 rounded-full bg-orange-500/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-orange-500/50">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
            </div>
            <div className="mt-6 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                AI scanning for hidden gems…
              </p>
            </div>
          </div>
        )}

        {/* ── AI Results Vibe Tag ── */}
        {vibeLabel && !isScanning && aiGems && aiGems.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-orange-400/40 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-white">{vibeLabel}</span>
              <span className="text-xs text-orange-300 opacity-80">· {aiGems.length} gems</span>
            </div>
          </div>
        )}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isScanning, vibeLabel, aiGems]
  );
}
