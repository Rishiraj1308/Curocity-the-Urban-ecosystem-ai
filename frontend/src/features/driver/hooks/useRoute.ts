import { useState, useEffect } from 'react';

type Coord = { lat: number; lon: number };

export function useRoute(start: Coord | null, end: Coord | null) {
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!start || !end) {
        setRoute(null);
        return;
    }

    const fetchRouteData = async () => {
      try {
        // OSRM API Call
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          // [lon, lat] -> [lat, lon] conversion
          const coordinates = r.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          
          setRoute(coordinates as [number, number][]);
          setDistance(Number((r.distance / 1000).toFixed(1))); 
          setDuration(Math.round(r.duration / 60)); 
        } else {
            throw new Error("No route found");
        }
      } catch (error) {
        console.warn("Route API failed, using fallback line:", error);
        // 🔥 FALLBACK: Agar API fail ho, toh seedhi line bana do
        setRoute([[start.lat, start.lon], [end.lat, end.lon]]);
        setDistance(null);
        setDuration(null);
      }
    };

    fetchRouteData();
    
  }, [start?.lat, start?.lon, end?.lat, end?.lon]); 

  return { route, distance, duration };
}