import { NextResponse } from "next/server";

const OSRM_BASE =
  "https://routing.openstreetmap.de/routed-car";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing coordinates" },
      { status: 400 }
    );
  }

  const osrmUrl = `${OSRM_BASE}/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(osrmUrl, {
      headers: {
        "User-Agent": "CuroCity/1.0",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok || !text.startsWith("{")) {
      console.error("OSRM RAW ERROR:", text);
      return NextResponse.json(
        { error: "OSRM unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("Routing API crash:", err);
    return NextResponse.json(
      { error: "Routing service failed" },
      { status: 500 }
    );
  }
}
