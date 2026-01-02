'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet'; // ✅ FIX: Yeh line add karni thi
import 'leaflet.heat'; // Make sure to install: npm i leaflet.heat

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // TypeScript ignore kyunki leaflet.heat ke types kabhi-kabhi issue karte hain
    // @ts-ignore 
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      // Clean up layer on unmount
      if (map && heat) {
        map.removeLayer(heat);
      }
    };
  }, [map, points]);

  return null;
}