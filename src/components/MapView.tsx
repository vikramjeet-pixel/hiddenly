"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import mapStyles from "@/lib/map-styles.json";

interface MapViewProps {
  gems: any[];
}

export default function MapView({ gems }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<any[]>([]); // To safely garbage collect advanced markers

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      // Return early if we already instantiated the Map API (Memoized prevent reloads)
      if (!mapRef.current || mapInstance) return;

      setOptions({
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Ensure you inject this into .env!
        v: "weekly" // Modern parameter mapping uses 'v' and 'key'
      });

      try {
        const { Map } = await importLibrary("maps") as any;
        
        if (!active) return;

        const map = new Map(mapRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false, // Cleaner without default zoom boxes taking up mobile screen
          gestureHandling: "greedy", // CRITICAL FOR MOBILE: Allows single-finger navigation
          mapId: "DEMO_MAP_ID", 
          backgroundColor: "#17263c",
        });

        setMapInstance(map);
      } catch (err) {
        console.error("Failed to load Google Maps SDK:", err);
      }
    };

    initMap();

    return () => { active = false; };
  }, [mapInstance]);

  // Synchronize Google Map Markers array when 'gems' props re-fetch from Firestore
  useEffect(() => {
    if (!mapInstance) return;

    const syncMarkers = async () => {
      // Natively clear old markers prior to repopulating
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(m => { m.map = null; });
      markersRef.current = [];

      try {
        const { AdvancedMarkerElement, PinElement } = await importLibrary("marker") as any;

        const newMarkers = gems
          .filter((gem) => gem.latitude && gem.longitude)
          .map((gem) => {
            const lat = parseFloat(gem.latitude);
            const lng = parseFloat(gem.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            // Highly Custom InfoBox Overlay Template
            const contentDiv = document.createElement("div");
            contentDiv.className = "flex flex-col gap-2 min-w-[160px] p-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]";
            contentDiv.innerHTML = `
              ${gem.media && gem.media[0] ? `<img src="${gem.media[0]}" class="w-full h-24 object-cover rounded-lg bg-black/50" alt="${gem.title || 'Gem'}" />` : ""}
              <div class="px-1 py-0.5 flex flex-col">
                <span class="text-xs font-serif font-black italic text-white leading-tight truncate w-32">${gem.title}</span>
                <span class="text-[9px] text-primary font-bold uppercase tracking-widest mt-0.5 opacity-80 flex items-center gap-0.5"><span class="material-symbols-outlined text-[10px]">location_on</span>${gem.locationName || gem.city || "Unknown"}</span>
              </div>
            `;

            // Custom Brand Pin Design
            const pin = new PinElement({
              background: "#000000",
              borderColor: "#ff4d4d", // App Primary color accent 
              glyphColor: "#ff4d4d",
              scale: 1.1
            });

            const marker = new AdvancedMarkerElement({
              map: mapInstance,
              position: { lat, lng },
              content: pin.element,
              title: gem.title,
            });

            // Fast native click overlay 
            let infoWindow: any;
            marker.addListener('click', async () => {
              const { InfoWindow } = await importLibrary("maps") as any;
              if (infoWindow) infoWindow.close();
              infoWindow = new InfoWindow({
                content: contentDiv,
                headerDisabled: true, // Requires Weekly version Google Maps loader
                minWidth: 160
              });
              infoWindow.open({ anchor: marker, map: mapInstance });
            });

            return marker;
          })
          .filter(Boolean); // Clear any NaNs

        markersRef.current = newMarkers;

        // Bundle overlapping markers securely using Clusterer algorithm
        clustererRef.current = new MarkerClusterer({ 
          map: mapInstance, 
          markers: newMarkers 
        });

      } catch (e) {
        console.error("Advanced Marker injection failed:", e);
      }
    };

    syncMarkers();
  }, [gems, mapInstance]);

  // Pure Component Memoization technique:
  // Using useMemo absolutely prevents React state 'viewMode' toggles from accidentally destroying and re-mounting the native Google Maps <iframe> container. Huge performance gain.
  return useMemo(() => (
    <div className="w-full h-[calc(100dvh-190px)] md:h-[calc(100vh-180px)] rounded-3xl md:rounded-[2rem] overflow-hidden border border-neutral-200 dark:border-white/10 shadow-lg md:shadow-2xl relative bg-neutral-900 animate-in fade-in duration-500 zoom-in-95">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  ), []);
}
