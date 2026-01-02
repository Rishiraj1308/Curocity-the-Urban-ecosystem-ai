import { NextResponse } from 'next/server';

// Base URL for the Nominatim API
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// A unique user agent to identify your application
const APP_USER_AGENT = 'Curocity/1.0 (support@curocity.in)';

export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  let nominatimUrl;

  if (searchQuery) {
    // 1️⃣ Forward Geocoding (Search)
    // 🔥 UPGRADE: limit=10 (Zyada options), layer=address,poi (Dukaan/Mall ke liye)
    let url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=10&addressdetails=1&layer=address,poi&dedupe=1&countrycodes=in`;

    // 🧠 SMART LOGIC: Location Bias
    if (lat && lon) {
      const l = parseFloat(lat);
      const ln = parseFloat(lon);

      if (!isNaN(l) && !isNaN(ln)) {
        // ~50km ka bounding box
        const viewbox = [
          ln - 0.4, // Left (West)
          l + 0.4,  // Top (North)
          ln + 0.4, // Right (East)
          l - 0.4   // Bottom (South)
        ].join(',');

        // 🔥 IMPORTANT CHANGE: bounded=0
        // 0 ka matlab: "Pehle aas-paas dhundo, agar wahan na mile to poore India mein dhundo"
        // 1 ka matlab: "Sirf aas-paas dhundo, warna result mat do" (Ye humne hata diya)
        url += `&viewbox=${viewbox}&bounded=0`;
      }
    } 

    nominatimUrl = url;

  } else if (lat && lon) {
    // 2️⃣ Reverse Geocoding (Lat/Lon -> Address)
    nominatimUrl = `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`;
  } else {
    return NextResponse.json(
      { error: 'Either a search query (q) or latitude/longitude (lat, lon) is required.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': APP_USER_AGENT,
        'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8', // 🔥 Prefer Indian English
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal server error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}