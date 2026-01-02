"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- 📐 1. MATHS HELPER: Bearing Calculation ---
function getBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
            
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// --- 🔥 2. PINS ---
const createVectorPin = (color: string, type: 'square' | 'circle') => {
    const innerShape = type === 'square' 
        ? `<rect x="7" y="7" width="10" height="10" fill="${color}" />` 
        : `<circle cx="12" cy="12" r="5" fill="${color}" />`;           

    const svg = `
      <svg width="40" height="50" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 24V14" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <rect x="0" y="0" width="24" height="24" rx="12" fill="white" stroke="black" stroke-width="0"/>
        <path d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z" fill="white"/>
        ${innerShape}
      </svg>
    `;
    return L.divIcon({ className: 'vector-pin', html: svg, iconSize: [40, 50], iconAnchor: [20, 50], popupAnchor: [0, -50] });
};

const pickupPin = createVectorPin('#16a34a', 'square'); 
const dropPin = createVectorPin('#dc2626', 'circle');   

// --- 🚗 3. FIXED VEHICLE MARKER (No Crash Logic) ---
const VehicleMarker = ({ position, type }: { position: [number, number], type: string }) => {
    const markerRef = useRef<any>(null);
    const prevPos = useRef(position);
    
    // Choose Icon URL
    let iconUrl = 'https://cdn-icons-png.flaticon.com/512/741/741407.png'; // Car
    if (type.toLowerCase().includes('bike')) iconUrl = 'https://cdn-icons-png.flaticon.com/512/171/171255.png';
    if (type.toLowerCase().includes('auto')) iconUrl = 'https://cdn-icons-png.flaticon.com/512/3097/3097136.png';

    // 🔥 FIX: Create Icon ONCE. Do not recreate on rotation.
    const stableIcon = useMemo(() => {
        return L.divIcon({
            className: 'vehicle-marker-container',
            html: `
                <img 
                    src="${iconUrl}" 
                    class="vehicle-img"
                    style="
                        width: 40px; 
                        height: 40px; 
                        transition: transform 0.5s ease-out;
                        filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));
                    "
                />
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    }, [type]); // Re-create only if vehicle type changes

    // Handle Rotation via Direct DOM Manipulation (Prevents Leaflet Crash)
    useEffect(() => {
        if (!markerRef.current) return;

        // 1. Calculate Rotation
        const angle = getBearing(prevPos.current[0], prevPos.current[1], position[0], position[1]);
        
        // 2. Update Previous Position
        prevPos.current = position;

        // 3. Find the DOM element and rotate it directly
        const markerElement = markerRef.current.getElement();
        if (markerElement) {
            const img = markerElement.querySelector('.vehicle-img');
            if (img) {
                img.style.transform = `rotate(${angle}deg)`;
            }
        }
    }, [position]);

    return <Marker ref={markerRef} position={position} icon={stableIcon} zIndexOffset={1000} />;
};

export interface LiveMapProps {
  driverLocation?: [number, number] | null;
  pickupLocation?: [number, number] | null;
  dropLocation?: [number, number] | null;
  routeCoordinates?: [number, number][] | null;
  vehicleType?: string;
  className?: string;
  userLocation?: any; 
  activePartners?: any;
}

// Controller
function MapController({ driverLocation, pickupLocation, dropLocation, routeCoordinates }: LiveMapProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { paddingTopLeft: [20, 20], paddingBottomRight: [20, 150] }); 
    } else {
        const points: L.LatLngTuple[] = [];
        if (driverLocation) points.push(driverLocation);
        if (pickupLocation) points.push(pickupLocation);
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
        }
    }
  }, [map, driverLocation, pickupLocation, dropLocation, routeCoordinates]);
  return null;
}

export default function LiveMap(props: LiveMapProps) {
  const { driverLocation, pickupLocation, dropLocation, routeCoordinates, vehicleType, className, userLocation } = props;
  const finalPickup = pickupLocation || (userLocation ? [userLocation.lat, userLocation.lon] : null);
  const center: [number, number] = driverLocation || finalPickup || [28.6139, 77.2090];

  return (
    <div className={`w-full h-full relative z-0 ${className || ""}`}>
      <style jsx global>{`
        /* Smooth movement for the marker itself (Lat/Lon) */
        .leaflet-marker-icon {
          transition: margin 0.5s linear, transform 0.5s linear;
        }
      `}</style>

      <MapContainer center={center} zoom={15} zoomControl={false} className="w-full h-full outline-none bg-slate-100">
        <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
            attribution="&copy; CARTO"
        />

        {/* Route */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} pathOptions={{ color: '#000', weight: 4, opacity: 0.8, lineCap: 'square' }} />
        )}

        {/* Pins */}
        {finalPickup && <Marker position={finalPickup as [number, number]} icon={pickupPin} />}
        {dropLocation && <Marker position={dropLocation} icon={dropPin} />}
        
        {/* 🔥 STABLE VEHICLE MARKER */}
        {driverLocation && <VehicleMarker position={driverLocation} type={vehicleType || 'car'} />}

        <MapController {...props} pickupLocation={finalPickup as [number, number]} />
      </MapContainer>
    </div>
  );
}