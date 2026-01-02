// src/lib/routing.ts

export type LatLng = [number, number];

/**
 * 🔍 SEARCH PLACE (Smart Local Search)
 * Ab ye 'userLocation' accept karega taaki results tumhare aaspas ke aayein.
 */
export const searchPlace = async (
  query: string, 
  userLocation?: { lat: number, lon: number } | null
) => {
  if (!query) return [];

  try {
    let url = `/api/search?q=${encodeURIComponent(query)}`;

    // ✅ FIX: Agar User Location hai, toh URL mein bhej do
    // Backend isko use karke sirf 50km area mein dhundega
    if (userLocation) {
      url += `&lat=${userLocation.lat}&lon=${userLocation.lon}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Search API Error:", await response.text());
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Search error", error);
    return [];
  }
};

/**
 * 🛣️ GET ROUTE (Real Road Path)
 * Uses German OSRM Mirror directly for reliable, road-snapped routing.
 */
export const getRoute = async (
  start: LatLng,
  end: LatLng
): Promise<LatLng[]> => {
  
  if (!start || !end || start[0] === undefined || end[0] === undefined) {
    throw new Error("Invalid coordinates");
  }

  // OSRM expects [lon, lat] format
  const startParam = `${start[1]},${start[0]}`;
  const endParam = `${end[1]},${end[0]}`;

  // ✅ FIX: Using Reliable German Server (High Accuracy)
  // Ye server "Straight Line" issue solve karta hai aur fast hai
  const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startParam};${endParam}?overview=full&geometries=geojson`;

  console.log("🛣️ Fetching Real Road Path:", osrmUrl);

  try {
    const response = await fetch(osrmUrl);

    if (!response.ok) {
      throw new Error(`Routing Server Error: ${response.status}`);
    }

    const data = await response.json();

    // Validate Data
    if (
      !data.routes ||
      !data.routes[0] ||
      !data.routes[0].geometry ||
      !Array.isArray(data.routes[0].geometry.coordinates)
    ) {
      throw new Error("No route found between these locations");
    }

    // Success! Return the zig-zag road path (Convert [lng, lat] -> [lat, lng])
    return data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

  } catch (error) {
    console.error("🔥 Route Failed:", error);
    throw error;
  }
};