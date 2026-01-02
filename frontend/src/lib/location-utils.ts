// Geocoding Utility using Internal API

// 📐 Distance Calculation Formula (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }
  
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
  
  export interface LocationSuggestion {
      place_id: number;
      lat: string;
      lon: string;
      display_name: string;      // Full address
      displayNameShort: string;  // Short Name (e.g. "Pacific Mall")
      distance?: string;         // "2.5 km"
      time?: string;             // "15 min"
      type?: string;             // "station", "mall", etc.
  }
  
  // 🔥 SMART SEARCH FUNCTION
  export async function fetchFuzzySuggestions(
      query: string, 
      userLat?: number | null, 
      userLon?: number | null
  ): Promise<LocationSuggestion[]> {
  
      if (!query || query.length < 3) return [];
  
      try {
          let url = `/api/search?q=${encodeURIComponent(query)}`;
          if (userLat && userLon) {
              url += `&lat=${userLat}&lon=${userLon}`;
          }
  
          const res = await fetch(url);
          if (!res.ok) return [];
  
          const data = await res.json();
  
          // 🔥 Yahan Magic Hoga: Data ko saaf karenge aur Distance add karenge
          return data.map((item: any) => {
              let distString = "";
              let timeString = "";
  
              // Agar User Location hai, to Distance Calculate karo
              if (userLat && userLon) {
                  const d = getDistanceFromLatLonInKm(userLat, userLon, Number(item.lat), Number(item.lon));
                  distString = d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
                  
                  // Average City Speed: 20 km/hr (approx)
                  const minutes = Math.ceil((d / 20) * 60);
                  timeString = minutes > 60 ? `${(minutes/60).toFixed(1)} hr` : `${minutes} min`;
              }
  
              // Name ko saaf karo
              const cleanName = item.name || item.display_name.split(',')[0];
              
              // Type (Optional): Mall, Station etc.
              const extraInfo = item.type && item.type !== 'yes' ? ` • ${item.type.replace(/_/g, ' ')}` : '';
  
              return {
                  place_id: item.place_id,
                  lat: item.lat,
                  lon: item.lon,
                  display_name: item.display_name,
                  displayNameShort: cleanName, // Sirf naam
                  type: item.type,
                  distance: distString, // ✅ "5.2 km"
                  time: timeString      // ✅ "18 min"
              };
          });
  
      } catch (error) {
          console.error("Search Error:", error);
          return [];
      }
  }
  
  // Reverse Geocoding
  export async function reverseGeocode(lat: number, lon: number): Promise<string> {
      try {
          const url = `/api/search?lat=${lat}&lon=${lon}`;
          const res = await fetch(url);
          if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          const data = await res.json();
          
          // Smart Naming
          const a = data.address || {};
          return a.amenity || a.shop || a.tourism || a.building || a.road || a.suburb || data.display_name.split(',')[0] || "Pinned Location";
          
      } catch (error) {
          return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
  }