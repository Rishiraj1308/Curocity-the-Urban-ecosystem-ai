import React, { useState, useEffect, useMemo } from 'react'; // 🔥 Import useMemo
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { useRoute } from '../hooks/useRoute'; 

const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

// Helper: Calculate Distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return Number((R * c).toFixed(1));
}

export function RidePopup({ jobRequest, driverLocation, onAccept, onDecline }: any) {
    const [timeLeft, setTimeLeft] = useState(20);
    const [pickupStats, setPickupStats] = useState({ dist: 0, time: 0 });

    // 🔥 FIX 1: useMemo to stabilize objects (Prevents Infinite Loop)
    const driverCoords = useMemo(() => {
        return driverLocation 
            ? { lat: driverLocation.latitude, lon: driverLocation.longitude } 
            : null;
    }, [driverLocation?.latitude, driverLocation?.longitude]);

    const pickupCoords = useMemo(() => {
        return jobRequest?.pickup?.location 
            ? { lat: jobRequest.pickup.location.latitude, lon: jobRequest.pickup.location.longitude } 
            : null;
    }, [jobRequest?.pickup?.location?.latitude, jobRequest?.pickup?.location?.longitude]);

    // Calculate Route
    const { route: routeCoordinates } = useRoute(driverCoords, pickupCoords);

    // 🔥 FIX 2: Dependency Array now uses primitive values (Safe)
    useEffect(() => {
        if (driverCoords && pickupCoords) {
            const dist = getDistanceFromLatLonInKm(driverCoords.lat, driverCoords.lon, pickupCoords.lat, pickupCoords.lon);
            const time = Math.ceil((dist / 25) * 60); 
            setPickupStats({ dist, time });
        }
    }, [driverCoords?.lat, driverCoords?.lon, pickupCoords?.lat, pickupCoords?.lon]);

    // Timer Logic
    useEffect(() => {
        if (!jobRequest) return;
        setTimeLeft(20);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onDecline();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [jobRequest, onDecline]);

    if (!jobRequest) return null;

    const tripDuration = jobRequest.distance ? Math.ceil((jobRequest.distance / 30) * 60) : 0;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-transparent"
            >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-w-md mx-auto relative">
                    
                    {/* Timer Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                        <motion.div 
                            initial={{ width: "100%" }} 
                            animate={{ width: "0%" }} 
                            transition={{ duration: 20, ease: "linear" }}
                            className="h-full bg-emerald-500"
                        />
                    </div>

                    {/* Header */}
                    <div className="p-5 pb-0 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-slate-900 text-white border-none px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
                                    {pickupStats.time} min to Pickup
                                </Badge>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {pickupStats.dist} km away
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">₹{jobRequest.fare}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Total Trip: {jobRequest.distance} km • ~{tripDuration} min
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border-2 border-emerald-100 shadow-sm">
                            {timeLeft}
                        </div>
                    </div>

                    {/* Map Preview */}
                    <div className="h-32 w-full mt-4 relative bg-slate-50 border-y border-slate-100 overflow-hidden">
                        
                        <LiveMap 
                             pickupLocation={jobRequest.pickup?.location ? [jobRequest.pickup.location.latitude, jobRequest.pickup.location.longitude] : undefined}
                             driverLocation={driverLocation ? [driverLocation.latitude, driverLocation.longitude] : undefined}
                             routeCoordinates={routeCoordinates} 
                        />
                        
                        <div className="absolute inset-0 z-10 pointer-events-none" /> 
                    </div>

                    {/* Customer Info */}
                    <div className="p-5">
                        <div className="space-y-6 relative pl-2">
                            <div className="absolute left-[11px] top-2 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200 -z-10" />

                            {/* PICKUP */}
                            <div className="flex gap-4 relative">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">PICKUP</p>
                                        <span className="text-[10px] text-slate-400 font-medium">({pickupStats.dist} km from you)</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 leading-snug">
                                        {jobRequest.pickup?.address || 'Current Location'}
                                    </p>
                                </div>
                            </div>

                            {/* DROP */}
                            <div className="flex gap-4 relative">
                                <div className="w-6 h-6 rounded-full bg-red-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">DROP</p>
                                    <p className="text-sm font-bold text-slate-900 leading-snug">
                                        {jobRequest.destination?.address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-[1fr_2fr] gap-3 mt-6">
                            <Button 
                                variant="outline" 
                                className="h-14 rounded-2xl border-slate-200 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                onClick={onDecline}
                            >
                                Decline
                            </Button>
                            <Button 
                                className="h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg shadow-lg tracking-wide"
                                onClick={onAccept}
                            >
                                Accept for ₹{jobRequest.fare}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}