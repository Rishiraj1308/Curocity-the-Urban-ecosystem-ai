'use client';

import React, { useMemo, useState, useEffect } from "react";
import { 
  Phone, MessageCircle, Star, Car, Navigation, 
  Clock, Share2, ShieldAlert, IndianRupee, MapPin, ArrowRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RideData } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic'; 

// 🔥 FIREBASE
import { useFirebase } from "@/lib/firebase/client-provider";
import { doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore"; 

// 🔥 HOOK IMPORT
import { useRoute } from "@/features/driver/hooks/useRoute"; 

import { motion, AnimatePresence } from 'framer-motion';
import { RideChat } from "./RideChat"; 
import UserRideBill from "./UserRideBill"; 

// ✅ Load Map Dynamically
const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

// Helper for Distance Calculation
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return Number((R * c).toFixed(1));
}

interface DriverArrivingProps {
  ride: RideData;
  onCancel: () => void;
}

export default function DriverArriving({ ride, onCancel }: DriverArrivingProps) {
  const { db } = useFirebase();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => setMounted(true), []);

  const r = ride as any;

  // 🔥 1. Payment Listener (FIXED REDIRECT)
  useEffect(() => {
      if (!ride.id || !db) return;
      const unsubscribe = onSnapshot(doc(db, 'rides', ride.id), (docSnap) => {
          const data = docSnap.data();
          if (data && data.paymentStatus === 'paid') {
              toast.dismiss();
              toast.success("Ride Completed!");
              setTimeout(() => { router.replace('/user'); }, 1000); 
          }
      });
      return () => unsubscribe();
  }, [db, ride.id, router]);

  // Driver Info (With Smart Fallbacks)
  const driverName = r.driverName || "CuroCity Captain";      
  const driverPhoto = r.driverPhotoUrl || "";        
  const driverCarNo = r.driverCarNumber || "UP16 AB 1234"; // Demo fallback
  const driverCarModel = r.driverCarModel || r.vehicleType || "Sedan"; 
  const driverRating = r.driverRating || 4.9;
  const driverPhone = r.driverPhone || "";
  const otp = r.otp || "0000";

  // Vehicle Type Logic
  const vehicleTypeRaw = (r.driverVehicleType || r.vehicleType || "car").toLowerCase();
  let vehicleType = 'car';
  if (vehicleTypeRaw.includes('bike') || vehicleTypeRaw.includes('motorcycle')) vehicleType = 'bike';
  else if (vehicleTypeRaw.includes('auto') || vehicleTypeRaw.includes('rickshaw')) vehicleType = 'auto';

  // Status Check
  const isArrived = r.status === 'arrived';       
  const isOnTrip = r.status === 'in-progress';    
  const isArriving = r.status === 'accepted' || r.status === 'arriving';
  const isRideActive = isArriving || isArrived || isOnTrip;
  const isBillReady = (r.status === 'completed' || r.status === 'payment_pending') && (r.paymentStatus !== 'paid');

  // Locations
  const driverLoc = r.driverLocation ? { lat: r.driverLocation.latitude, lon: r.driverLocation.longitude } : null;
  const pickupLoc = r.pickup?.location ? { lat: r.pickup.location.latitude, lon: r.pickup.location.longitude } : null;
  const dropLoc = r.destination?.location ? { lat: r.destination.location.latitude, lon: r.destination.location.longitude } : null;

  // Route Logic
  let startPoint = null;
  let endPoint = null;
  if (isArriving) {
      startPoint = driverLoc;
      endPoint = pickupLoc;
  } else if (isOnTrip) {
      startPoint = driverLoc;
      endPoint = dropLoc;
  }

  const { route: routeCoordinates, distance, duration } = useRoute(startPoint, endPoint);

  const stats = useMemo(() => {
    if (distance && duration) return { dist: distance, time: duration };
    if (startPoint && endPoint) {
      const dist = getDistanceFromLatLonInKm(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon);
      const speed = isArriving ? 20 : 25; 
      const time = Math.ceil((dist / speed) * 60) + 2;
      return { dist, time };
    }
    return { dist: ride.distance || 0, time: Math.ceil((ride.distance || 0) * 2.5) };
  }, [distance, duration, startPoint, endPoint, isArriving, ride.distance]);

  const handleNavigate = () => {
    const target = (isArriving || isArrived) ? ride.pickup : ride.destination;
    if (!target?.location) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target.location.latitude},${target.location.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({ title: 'Track my Curocity Ride', url: window.location.href });
      } else {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied!");
      }
  };

  if (isBillReady) {
      return (
          <UserRideBill 
              ride={ride} 
              onPaymentComplete={async (method) => {
                  if (!db) return;
                  await updateDoc(doc(db, 'rides', ride.id), { paymentMethod: method });
              }}
              onRateDriver={async (stars) => {
                  if (!db) return;
                  await updateDoc(doc(db, 'rides', ride.id), { rating: stars, ratedAt: serverTimestamp() });
              }}
          />
      );
  }

  // Header Title Logic
  let headerTitle = "Heading to Pickup";
  let headerIcon = <Clock className="w-4 h-4 text-blue-400" />;
  let headerBg = "bg-slate-800 text-slate-200";

  if(isArrived) {
      headerTitle = "Driver Has Arrived";
      headerIcon = <MapPin className="w-4 h-4 animate-bounce text-white" />;
      headerBg = "bg-green-600 text-white shadow-green-500/30";
  } else if(isOnTrip) {
      headerTitle = "Heading to Destination";
      headerIcon = <Navigation className="w-4 h-4 text-emerald-400" />;
      headerBg = "bg-slate-900 text-slate-200";
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 relative overflow-hidden font-sans">
      
      {/* 4. MAP BACKGROUND */}
      <div className="absolute inset-0 z-0 h-full w-full">
         <LiveMap 
            routeCoordinates={routeCoordinates || []} 
            driverLocation={driverLoc ? [driverLoc.lat, driverLoc.lon] : undefined}
            pickupLocation={pickupLoc ? [pickupLoc.lat, pickupLoc.lon] : undefined}
            dropLocation={dropLoc ? [dropLoc.lat, dropLoc.lon] : undefined}
            vehicleType={vehicleType} 
         />
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && isRideActive && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white pointer-events-auto"
          >
            <RideChat 
                rideId={ride.id}
                currentUserId={ride.userId}
                otherUserName={driverName}
                otherUserPhoto={driverPhoto}
                userRole="user"
                onBack={() => setShowChat(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Floating Status Pill */}
      <div className={`fixed top-4 left-4 right-4 z-40 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
         <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-full shadow-2xl flex items-center p-1.5 pr-5 border border-white/10 mx-auto max-w-md w-fit">
            <div className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 min-w-[90px] shadow-sm ${headerBg}`}>
               {headerIcon}
               <span className="font-bold font-mono text-sm leading-none pt-0.5">
                 {isArrived ? "HERE" : `${stats.time} min`}
               </span>
            </div>
            <div className="text-right pl-3 flex flex-col justify-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                 {stats.dist} km away
               </p>
               <p className="text-xs font-bold text-white flex items-center justify-end gap-1">
                 {headerTitle}
               </p>
            </div>
         </div>
      </div>

      {/* Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl rounded-t-[2.5rem] shadow-[0_-10px_60px_-10px_rgba(0,0,0,0.3)] border-t border-white/60 p-6 pb-8 transition-transform duration-500 ease-out max-h-[70vh] overflow-y-auto no-scrollbar ${mounted ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-slate-200/60 rounded-full mx-auto mb-6 sticky top-0" />

        {/* OTP & Status Row */}
        <div className="flex justify-between items-center mb-6">
            <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isArrived ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isArrived ? 'bg-green-500 animate-bounce' : 'bg-blue-500 animate-pulse'}`} />
                {isArrived ? "Driver Arrived" : "On the way"}
            </div>
            <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">OTP</p>
                <p className="text-2xl font-black text-slate-900 leading-none tracking-widest">{otp}</p>
            </div>
        </div>

        {/* Driver Profile */}
        <div className="flex items-center gap-4 mb-8">
            <div className="relative">
                <Avatar className="w-16 h-16 border-[3px] border-white shadow-xl">
                    <AvatarImage src={driverPhoto} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">{driverName[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border-2 border-white">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> {driverRating}
                </div>
            </div>
            <div className="flex-1 text-left min-w-0">
                <h2 className="text-xl font-black text-slate-900 leading-tight truncate">{driverName}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">{driverCarNo}</span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 uppercase truncate">
                        <Car className="w-3 h-3" /> {driverCarModel}
                    </span>
                </div>
            </div>
            {/* Call Button (Prominent) */}
            <Button 
                onClick={() => window.open(`tel:${driverPhone}`)}
                className="w-12 h-12 rounded-full bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 shadow-sm p-0 shrink-0 flex items-center justify-center"
            >
                <Phone className="w-5 h-5" />
            </Button>
        </div>

        {/* Trip Info Box */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 mb-6 relative">
            {/* Timeline Line */}
            <div className="absolute left-[23px] top-[28px] bottom-[28px] w-0.5 bg-slate-300/40" />
            
            <div className="space-y-4">
                 <div className="flex gap-3 relative items-center z-10">
                     <div className="w-5 h-5 rounded-full bg-white border-[3px] border-blue-500 shadow-sm shrink-0" />
                     <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Pickup</p>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{typeof ride.pickup === 'string' ? ride.pickup : ride.pickup?.address}</p>
                     </div>
                 </div>
                 <div className="flex gap-3 relative items-center z-10">
                     <div className="w-5 h-5 rounded-full bg-white border-[3px] border-emerald-500 shadow-sm shrink-0" />
                     <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Drop</p>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{typeof ride.destination === 'string' ? ride.destination : ride.destination?.address}</p>
                     </div>
                 </div>
            </div>

            {/* Price Tag (Absolute Right) */}
            <div className="absolute top-4 right-4 text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                <p className="text-lg font-black text-slate-900">₹{ride.fare}</p>
            </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-4 gap-3">
            <Button onClick={() => setShowChat(true)} className="h-12 flex flex-col gap-0.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl shadow-sm">
                <MessageCircle className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Chat</span>
            </Button>
            
            <Button onClick={handleNavigate} className="h-12 flex flex-col gap-0.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-100 rounded-xl shadow-sm">
                <Navigation className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Nav</span>
            </Button>
            
            <Button onClick={handleShare} className="h-12 flex flex-col gap-0.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl shadow-sm">
                <Share2 className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Share</span>
            </Button>

            <Button className="h-12 flex flex-col gap-0.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl shadow-sm">
                 <ShieldAlert className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">SOS</span>
            </Button>
        </div>

        {/* Cancel Button */}
        {!isOnTrip && (
             <div className="mt-6 text-center">
                 <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 text-[10px] font-bold uppercase tracking-widest">
                    Cancel Ride
                 </Button>
             </div>
        )}
      </div>
    </div>
  );
}