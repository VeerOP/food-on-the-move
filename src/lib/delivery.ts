// Store location: Matunga, Mumbai 400019
export const STORE = {
  name: "Food On The Move — Matunga",
  address: "Matunga, Mumbai 400019",
  lat: 19.0270,
  lng: 72.8556,
};

// Configurable delivery constants
export const DELIVERY_RADIUS_KM = 5;
export const DELIVERY_FEE_INR = 200;
export const FREE_DELIVERY_THRESHOLD_INR = 1000;

export function computeDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD_INR ? 0 : DELIVERY_FEE_INR;
}

// Haversine distance in km
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceFromStore(lat: number, lng: number) {
  return distanceKm(STORE.lat, STORE.lng, lat, lng);
}

export function isWithinRadius(lat: number, lng: number) {
  return distanceFromStore(lat, lng) <= DELIVERY_RADIUS_KM;
}

// Free geocoding via Nominatim (OpenStreetMap). No key required.
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; display: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address
  )}`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name,
    };
  } catch {
    return null;
  }
}
