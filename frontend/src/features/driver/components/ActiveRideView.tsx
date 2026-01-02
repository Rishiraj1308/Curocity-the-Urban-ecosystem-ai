'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Navigation, Phone, MessageCircle, 
    Clock, MapPin, 
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import type { RideData } from '@/lib/types';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useDriver } from '@/context/DriverContext';
import { useRoute } from '../hooks/useRoute';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 UTILS & COMPONENTS
import { generateInvoiceID } from '@/utils/invoiceHelper';
import { RidePaymentView } from './RidePaymentView';
import { RideChat } from '@/features/user/components/ride/RideChat'; 

// ✅ Load Map Dynamically
const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

// Helper for Stats
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return Number((R * c).toFixed(1));
}

interface ActiveRideViewProps {
  activeRide: RideData;
}

export function ActiveRideView({ activeRide }: ActiveRideViewProps) {
  const { db } = useFirebase();
  const { partnerData } = useDriver(); 
  
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [stats, setStats] = useState({ dist: 0, time: 0 });
  const [showChat, setShowChat] = useState(false);

  useEffect(() => setMounted(true), []);

  const isArrived = activeRide.status === 'arrived';
  const isOnTrip = activeRide.status === 'in-progress';
  const isHeadingToPickup = activeRide.status === 'accepted' || activeRide.status === 'arriving';

  // 🔥 1. DRIVER LOCATION & VEHICLE TYPE
  const driverLoc = useMemo(() => 
      partnerData?.currentLocation ? { lat: partnerData.currentLocation.latitude, lon: partnerData.currentLocation.longitude } : null, 
  [partnerData?.currentLocation]);

  const myVehicleType = (partnerData?.vehicleType || 'car').toLowerCase(); 

  const pickupLoc = useMemo(() => activeRide.pickup?.location ? { lat: activeRide.pickup.location.latitude, lon: activeRide.pickup.location.longitude } : null, [activeRide.pickup?.location]);
  const dropLoc = useMemo(() => activeRide.destination?.location ? { lat: activeRide.destination.location.latitude, lon: activeRide.destination.location.longitude } : null, [activeRide.destination?.location]);

  // 🔥 2. ROUTE LOGIC
  let startPoint = null;
  let endPoint = null;

  if (isHeadingToPickup) {
      startPoint = driverLoc;
      endPoint = pickupLoc;
  } else if (isOnTrip) {
      startPoint = driverLoc;
      endPoint = dropLoc;
  }

  const { route: routeCoordinates, distance, duration } = useRoute(startPoint, endPoint);

  useEffect(() => {
    if (distance && duration) {
        setStats({ dist: distance, time: duration });
    } else if (startPoint && endPoint) {
        const dist = getDistanceFromLatLonInKm(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon);
        const speed = isHeadingToPickup ? 25 : 30; 
        const time = Math.ceil((dist / speed) * 60);
        setStats({ dist, time });
    }
  }, [distance, duration, startPoint, endPoint, isHeadingToPickup]);

  // Fetch Rider Profile from 'users' collection
  useEffect(() => {
    const targetId = activeRide.riderId || (activeRide as any).userId; 
    if (!db || !targetId) return;
    const unsub = onSnapshot(doc(db, 'users', targetId), (docSnap) => {
        if (docSnap.exists()) setRiderProfile(docSnap.data());
    });
    return () => unsub();
  }, [db, activeRide]);

  // 🔥 FIXED NAME LOGIC: Check all possible fields
  const finalRiderName = useMemo(() => {
    // 1. Try fetching from Live Profile (Database)
    if (riderProfile) {
        if (riderProfile.name) return riderProfile.name;          // Check 'name'
        if (riderProfile.fullName) return riderProfile.fullName;  // Check 'fullName'
        if (riderProfile.displayName) return riderProfile.displayName; // Check 'displayName'
    }

    // 2. Try fetching from Ride Data (Snapshot)
    if (activeRide.riderName && activeRide.riderName !== "User") return activeRide.riderName;
    if ((activeRide as any).userName) return (activeRide as any).userName;

    // 3. Last Resort: Show Phone Number instead of "User"
    const phone = activeRide.riderPhone || riderProfile?.phoneNumber || riderProfile?.phone;
    if (phone) return `Passenger (${phone.slice(-4)})`;

    return "Passenger";
  }, [riderProfile, activeRide]);

  const finalRiderPhoto = riderProfile?.photoURL || (activeRide as any).riderPhotoUrl || (activeRide as any).userPhotoUrl;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!db || !partnerData) return;
    setIsProcessing(true);
    try {
        const rideRef = doc(db, 'rides', activeRide.id);
        if (newStatus === 'in-progress') {
            if (otp !== activeRide.otp) { toast.error("Incorrect OTP!"); setIsProcessing(false); return; }
            await updateDoc(rideRef, { status: 'in-progress', startTime: serverTimestamp() });
        } else if (newStatus === 'completed') {
            const tripSeq = ((partnerData as any).totalRides || 0) + 1;
            const newInvoiceID = generateInvoiceID(partnerData.phone || "000", partnerData.vehicleNumber || "XX00", tripSeq);
            await updateDoc(rideRef, { 
                status: 'completed', endTime: serverTimestamp(), 
                paymentStatus: 'pending', duration: stats.time, distance: stats.dist, 
                invoiceId: newInvoiceID
            });
        } else {
            await updateDoc(rideRef, { status: newStatus });
        }
    } catch (e) { toast.error("Update failed"); } finally { setIsProcessing(false); }
  };

  if (activeRide.status === 'payment_pending' || activeRide.status === 'completed') {
      return (
          <RidePaymentView 
              ride={activeRide} driver={partnerData} riderName={finalRiderName} riderPhoto={finalRiderPhoto}
              onConfirmPayment={() => updateDoc(doc(db!, 'rides', activeRide.id), { paymentStatus: 'paid' })} 
              onFinish={() => window.location.reload()}
          />
      );
  }

  let statusText = "Heading to Pickup";
  let statusIcon = <Clock className="w-3.5 h-3.5 animate-pulse" />;
  let statusColorClass = "bg-white/10";
  
  if (isArrived) {
      statusText = "Waiting for Passenger";
      statusIcon = <MapPin className="w-3.5 h-3.5 animate-bounce text-orange-400" />;
      statusColorClass = "bg-orange-500/20 text-orange-300";
  } else if (isOnTrip) {
      statusText = "Heading to Drop";
      statusIcon = <Navigation className="w-3.5 h-3.5 text-emerald-400" />;
      statusColorClass = "bg-emerald-500/20 text-emerald-300";
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans">
        
        <AnimatePresence>
            {showChat && (
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[100] bg-white pointer-events-auto">
                    <RideChat 
                        rideId={activeRide.id}
                        currentUserId={partnerData?.id || ''}
                        otherUserName={finalRiderName}
                        otherUserPhoto={finalRiderPhoto}
                        userRole="driver"
                        onBack={() => setShowChat(false)}
                    />
                </motion.div>
            )}
        </AnimatePresence>

        {/* 🔥 MAP */}
        <div className="flex-1 relative">
            <LiveMap 
                routeCoordinates={routeCoordinates}
                driverLocation={driverLoc ? [driverLoc.lat, driverLoc.lon] : undefined}
                pickupLocation={pickupLoc ? [pickupLoc.lat, pickupLoc.lon] : undefined}
                dropLocation={dropLoc ? [dropLoc.lat, dropLoc.lon] : undefined}
                vehicleType={myVehicleType} 
            />
        </div>

        {/* Floating Status (NOW AT TOP) */}
        <div className={`fixed top-4 left-4 right-4 z-40 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
             <div className="bg-slate-900/95 backdrop-blur-md text-white p-1 rounded-full shadow-2xl flex items-center justify-between pr-4 mx-2 border border-white/10">
                <div className={`flex items-center gap-3 rounded-full px-4 py-2 ${statusColorClass}`}>
                   {statusIcon}
                   <span className="font-bold font-mono text-sm">{stats.time} min</span>
                </div>
                <p className="text-xs font-bold text-slate-200">{stats.dist} km • {statusText}</p>
             </div>
        </div>

        {/* Bottom Sheet */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_60px_-10px_rgba(0,0,0,0.3)] border-t border-white/60 p-6 pb-8 transition-transform duration-500 ease-out ${mounted ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="w-12 h-1.5 bg-slate-300/60 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start gap-2 mb-6">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <Avatar className="w-14 h-14 border-4 border-white shadow-lg">
                            <AvatarImage src={finalRiderPhoto} />
                            <AvatarFallback className="bg-slate-900 text-white font-bold">{finalRiderName ? finalRiderName[0] : 'P'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-slate-900 leading-tight truncate text-left">{finalRiderName}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-green-200 uppercase tracking-tighter italic">₹{activeRide.fare} {activeRide.paymentMethod}</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button onClick={() => setShowChat(true)} size="icon" className="h-11 w-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"><MessageCircle className="w-5 h-5" /></Button>
                    <Button onClick={() => window.open(`tel:${(activeRide as any).riderPhone || riderProfile?.phone}`)} size="icon" className="h-11 w-11 rounded-full bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 shadow-sm"><Phone className="w-5 h-5" /></Button>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 shadow-inner">
                <div className="relative pl-3 space-y-4 text-left">
                     <div className="absolute left-[8px] top-2 bottom-2 w-0.5 bg-slate-300/50" />
                     <div className="flex items-start gap-3 relative">
                         <div className="w-4 h-4 rounded-full bg-white border-[3px] border-blue-500 shadow-sm z-10 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pickup</p>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{activeRide.pickup?.address}</p>
                         </div>
                     </div>
                     <div className="flex items-start gap-3 relative">
                         <div className="w-4 h-4 rounded-full bg-white border-[3px] border-emerald-500 shadow-sm z-10 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Drop</p>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{activeRide.destination?.address}</p>
                         </div>
                     </div>
                </div>
            </div>

            {/* Actions */}
            {isHeadingToPickup && !isArrived && (
                <div className="flex gap-2">
                     <Button onClick={() => window.open(`http://googleusercontent.com/maps.google.com/?q=${pickupLoc?.lat},${pickupLoc?.lon}`)} className="h-14 w-16 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 shadow-sm shrink-0"><Navigation className="w-6 h-6" /></Button>
                     <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-500/20 tracking-wide" onClick={() => handleUpdateStatus('arrived')} disabled={isProcessing}>I HAVE ARRIVED</Button>
                </div>
            )}

            {isArrived && (
                <div className="flex gap-2">
                     <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl flex items-center px-4 h-14 relative focus-within:border-emerald-500 transition-colors shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 absolute top-1 left-4">OTP</span>
                        <Input placeholder="----" className="border-none text-2xl font-black tracking-[0.5em] h-full p-0 mt-2 bg-transparent" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} type="number" />
                     </div>
                     <Button className={`flex-[1.5] h-14 text-lg font-black rounded-xl shadow-lg ${otp.length === 4 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400'}`} onClick={() => handleUpdateStatus('in-progress')} disabled={isProcessing || otp.length < 4}>
                        START TRIP
                     </Button>
                </div>
            )}

            {isOnTrip && (
                <div className="flex gap-2">
                     <Button onClick={() => window.open(`http://googleusercontent.com/maps.google.com/?q=${dropLoc?.lat},${dropLoc?.lon}`)} className="h-14 w-16 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 shadow-sm shrink-0"><Navigation className="w-6 h-6" /></Button>
                     <Button className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white font-black text-lg rounded-xl shadow-lg shadow-red-500/20 tracking-wide" onClick={() => handleUpdateStatus('completed')} disabled={isProcessing}>COMPLETE RIDE</Button>
                </div>
            )}
        </div>
    </div>
  );
}