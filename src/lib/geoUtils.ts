import { geohashForLocation } from "geofire-common";

// ── GeoData ───────────────────────────────────────────────────────────────────

/**
 * GeoData — the three fields written to every Firestore gem document
 * for proximity-based querying via geofire-common.
 */
export interface GeoData {
  geohash: string; // 9-character Geohash precision string
  lat: number;
  lng: number;
}

/**
 * generateGeoData
 * ---------------
 * Takes a latitude/longitude pair and returns the full GeoData object
 * ready to be spread into a Firestore addDoc / setDoc / updateDoc call.
 *
 * Precision 9 → ~4.8 m accuracy, ideal for point-of-interest searching.
 *
 * @example
 * const geo = generateGeoData(35.6762, 139.6503); // Tokyo
 * // { geohash: "xn774c2fb", lat: 35.6762, lng: 139.6503 }
 */
export function generateGeoData(lat: number, lng: number): GeoData {
  if (lat < -90 || lat > 90) throw new RangeError(`Invalid latitude: ${lat}`);
  if (lng < -180 || lng > 180) throw new RangeError(`Invalid longitude: ${lng}`);

  const geohash = geohashForLocation([lat, lng], 9);
  return { geohash, lat, lng };
}

// ── Distance ──────────────────────────────────────────────────────────────────

export type DistanceUnit = "km" | "mi";

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * calculateDistance
 * -----------------
 * Haversine great-circle distance between two lat/lng coordinate pairs.
 *
 * @param from     Starting coordinate  { lat, lng }
 * @param to       Destination coordinate { lat, lng }
 * @param unit     "km" (default) or "mi"
 * @returns        Distance rounded to 1 decimal place
 *
 * @example
 * calculateDistance({ lat: 51.5, lng: -0.1 }, { lat: 48.8, lng: 2.3 })
 * // → 340.6  (km from London to Paris)
 */
export function calculateDistance(
  from: LatLng,
  to: LatLng,
  unit: DistanceUnit = "km"
): number {
  const R = unit === "km" ? 6371 : 3958.8; // Earth's radius in km or miles

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const a =
    sinDLat * sinDLat +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // 1 decimal place
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * formatDistance
 * --------------
 * Human-readable distance string, automatically switching to meters/feet
 * for very short distances.
 *
 * @example
 * formatDistance(0.4, "km")  → "400 m"
 * formatDistance(35.6, "km") → "35.6 km"
 * formatDistance(0.3, "mi")  → "528 ft"
 */
export function formatDistance(distance: number, unit: DistanceUnit = "km"): string {
  if (unit === "km") {
    return distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance} km`;
  } else {
    return distance < 0.5
      ? `${Math.round(distance * 5280)} ft`
      : `${distance} mi`;
  }
}
