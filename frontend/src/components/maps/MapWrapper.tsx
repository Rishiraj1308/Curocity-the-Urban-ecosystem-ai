"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "next-themes";

// --------------------------------------------------------
// 🎨 PROFESSIONAL ICONS (Clean & Modern)
// --------------------------------------------------------

// A. USER LOCATION (Pulsing Dot)
const createPulseIcon = (isDark: boolean) => {
  // Satellite (Dark) pe Cyan, Road (Light) pe Blue
  const color = isDark ? "#38bdf8" : "#2563eb"; 
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; width: 100%; height: 100%;">
        <div style="
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 16px; height: 16px; 
          background-color: ${color}; 
          border: 3px solid white; border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 2;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 40px; height: 40px; 
          background-color: ${color}; opacity: 0.4; border-radius: 50%;
          animation: userPulse 2s infinite; z-index: 1;
        "></div>
        <style>@keyframes userPulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.4; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }</style>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// B. DESTINATION (Premium Black Pin)
const createDestinationIcon = () => {
  // Ye icon har background pe clear dikhta hai
  const svgIcon = `
    <div style="position: relative; width: 50px; height: 50px; display: flex; justify-content: center; align-items: center;">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="#000000" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    className: "custom-target-icon",
    html: svgIcon,
    iconSize: [50, 50],
    iconAnchor: [25, 45],
  });
};

// --------------------------------------------------------
// 🎮 MAP CONTROLLER
// --------------------------------------------------------
function MapController({ coords, userLoc }: { coords: any, userLoc: any }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [80, 80], animate: true, duration: 1 });
    } else if (userLoc) {
      map.flyTo([userLoc.lat, userLoc.lon], 16, { animate: true, duration: 1.5 });
    }
  }, [coords, userLoc, map]);
  return null;
}

// --------------------------------------------------------
// 🗺️ MAIN COMPONENT
// --------------------------------------------------------
export default function MapWrapper({ userLocation, routeCoordinates }: any) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const defaultCenter: [number, number] = [28.6139, 77.2090];
  const position = userLocation ? [userLocation.lat, userLocation.lon] : defaultCenter;
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={position as [number, number]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full outline-none"
        style={{ background: isDark ? "#0f172a" : "#e5e7eb" }}
      >
        {/* 🌍 THE REAL DEAL: Google Maps Tiles (No Filters, No Hacks)
           Light Mode: Standard Google Maps (Clean)
           Dark Mode:  Google Satellite Hybrid (Premium Realism)
        */}
        <TileLayer
          attribution='&copy; Google Maps'
          url={isDark 
            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" // Hybrid Satellite (Dark/Real)
            : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" // Standard Roads (Light)
          }
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        <MapController coords={routeCoordinates} userLoc={userLocation} />

        {/* User Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={createPulseIcon(isDark)}>
            <Popup>You</Popup>
          </Marker>
        )}

        {/* Route */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <>
            {/* White Border for Route (Makes it visible on Satellite) */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: "white", weight: 7, opacity: 0.8, lineCap: "round" }}
            />
            {/* Main Black Route */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{ color: "black", weight: 4, opacity: 1, lineCap: "round" }}
            />
            
            {/* Destination Pin */}
            <Marker position={routeCoordinates[routeCoordinates.length - 1]} icon={createDestinationIcon()}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}