'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

// --- ICONS SETUP ---
const createIcon = (color: string, type: 'car' | 'pin') => {
  const svg = type === 'car' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black" width="32" height="32"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

  return new L.DivIcon({
    html: svg,
    className: 'bg-transparent',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const driverIcon = createIcon('black', 'car');
const pickupIcon = createIcon('#10b981', 'pin'); // Green
const dropIcon = createIcon('#ef4444', 'pin');   // Red

// --- INTERFACE (Ab ye Powerful hai) ---
interface MiniMapProps {
  riderLocation?: [number, number]; // Pickup [lat, lng]
  driverLocation?: [number, number]; // Driver [lat, lng]
  dropLocation?: [number, number];   // Destination [lat, lng]
  driverVehicleType?: string;
  className?: string;
}

// --- AUTO ZOOM CONTROLLER ---
function MapController({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [bounds, map]);
  return null;
}

const ThemedTileLayer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const tileUrl = isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    return <TileLayer url={tileUrl} />;
};

const MiniMap = ({ riderLocation, driverLocation, dropLocation }: MiniMapProps) => {
    const [isClient, setIsClient] = useState(false);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);

    useEffect(() => setIsClient(true), []);

    // 1. ROUTE CALCULATION (Automatic)
    useEffect(() => {
        const fetchRoute = async () => {
            let start = driverLocation;
            let end = riderLocation || dropLocation;

            // Priority Logic: Driver -> Pickup (Pickup Phase)
            if (driverLocation && riderLocation && !dropLocation) {
                start = driverLocation;
                end = riderLocation;
            }
            // Priority Logic: Driver -> Drop (Trip Phase)
            else if (driverLocation && dropLocation) {
                start = driverLocation;
                end = dropLocation;
            }
            // Priority Logic: Pickup -> Drop (Preview Phase)
            else if (riderLocation && dropLocation) {
                start = riderLocation;
                end = dropLocation;
            }

            if (!start || !end) return;

            try {
                // Free OSRM API for Route Line
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
                );
                const data = await response.json();
                if (data.routes && data.routes[0]) {
                    const coordinates = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                    setRoutePath(coordinates as [number, number][]);
                }
            } catch (e) {
                console.error("Route Error", e);
                setRoutePath([start, end]); // Fallback straight line
            }
        };
        fetchRoute();
    }, [driverLocation, riderLocation, dropLocation]);

    // 2. AUTO FIT BOUNDS
    useEffect(() => {
        const points = [];
        if (driverLocation) points.push(driverLocation);
        if (riderLocation) points.push(riderLocation);
        if (dropLocation) points.push(dropLocation);
        
        if (points.length >= 2) {
            setMapBounds(points as L.LatLngBoundsExpression);
        } else if (points.length === 1) {
            setMapBounds([points[0], points[0]] as L.LatLngBoundsExpression);
        }
    }, [driverLocation, riderLocation, dropLocation]);
    
    if (!isClient) return <div className="w-full h-full bg-slate-100 animate-pulse" />;
    
    // Default center (India) if no props
    const centerPos: [number, number] = driverLocation || riderLocation || [28.6139, 77.2090];

  return (
    <MapContainer
      center={centerPos}
      zoom={14}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
      attributionControl={false}
      dragging={true} // Enabled dragging for better view
    >
        <ThemedTileLayer />
        
        {/* Auto Zoom */}
        <MapController bounds={mapBounds} />

        {/* 🚗 Driver Marker */}
        {driverLocation && (
            <Marker position={driverLocation} icon={driverIcon}>
                <Popup>Driver</Popup>
            </Marker>
        )}

        {/* 🟢 Pickup Marker */}
        {riderLocation && (
            <Marker position={riderLocation} icon={pickupIcon}>
                <Popup>Pickup</Popup>
            </Marker>
        )}

        {/* 🔴 Drop Marker */}
        {dropLocation && (
            <Marker position={dropLocation} icon={dropIcon}>
                <Popup>Drop</Popup>
            </Marker>
        )}

        {/* 🔵 Route Line */}
        {routePath.length > 0 && (
            <Polyline 
                positions={routePath} 
                color="#2563eb" // Blue color
                weight={5} 
                opacity={0.8} 
            />
        )}
    </MapContainer>
  );
};

export default MiniMap;