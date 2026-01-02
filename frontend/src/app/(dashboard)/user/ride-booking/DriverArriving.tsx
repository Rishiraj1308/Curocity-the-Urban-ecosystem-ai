"use client";

import React from "react";
import { Phone, Star, MapPin, XCircle, Navigation, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Map Load Logic
const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-200 animate-pulse flex items-center justify-center text-slate-400 font-bold">Loading Map...</div>
});

interface DriverArrivingProps {
  ride: any;
  onCancel: () => void;
}

export default function DriverArriving({ ride, onCancel }: DriverArrivingProps) {
  if (!ride) return null;

  const driverName = ride.driverName || "Captain";
  const driverPhoto = ride.driverPhoto || "";
  const driverRating = ride.driverRating || "4.8";
  
  // Data Fallback
  const vehicleModel = ride.driverVehicleModel || "Swift Dzire"; 
  const vehicleNumber = ride.driverVehicleNumber || "DL 3C AB 1234"; 
  const otp = ride.otp || "9999";
  
  // Status Logic
  const isArrived = ride.status === 'arrived';
  const isInProgress = ride.status === 'in-progress';
  
  const statusText = isArrived ? 'Captain Arrived' : isInProgress ? 'On the way' : 'Captain is Arriving';
  const statusColor = isArrived ? 'bg-green-600' : isInProgress ? 'bg-blue-600' : 'bg-black';

  // 🔥 GOOGLE MAPS BUTTON LOGIC
  const openGoogleMaps = () => {
      const targetLoc = isInProgress ? ride.destination?.location : ride.pickup?.location;
      
      if (targetLoc) {
          // Universal Link
          const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLoc.latitude},${targetLoc.longitude}&travelmode=driving`;
          window.open(url, '_blank');
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-slate-100">
      
      {/* 🗺️ MAP SECTION (Top 55%) */}
      <div className="h-[55%] w-full relative border-b-4 border-white shadow-lg z-0">
         <LiveMap 
            driverLocation={ride.driverLocation ? [ride.driverLocation.latitude, ride.driverLocation.longitude] : undefined}
            pickupLocation={ride.pickup?.location ? [ride.pickup.location.latitude, ride.pickup.location.longitude] : undefined}
            dropLocation={ride.destination?.location ? [ride.destination.location.latitude, ride.destination.location.longitude] : undefined}
            isTripInProgress={isInProgress}
         />
         
         {/* Top Gradient */}
         <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

         {/* Status Pill (Floating Center) */}
         <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
             <motion.div 
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className={`${statusColor} text-white px-5 py-2 rounded-full font-bold shadow-2xl flex items-center gap-2 text-sm tracking-wide border border-white/20`}
             >
                 {!isArrived && <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                 {statusText}
             </motion.div>
         </div>
      </div>

      {/* 📋 BOTTOM SHEET (Details) */}
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="h-auto bg-white rounded-t-[2rem] shadow-[0_-10px_50px_rgba(0,0,0,0.2)] relative -mt-6 z-20 flex flex-col"
      >
        {/* Handle Bar */}
        <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pb-8 pt-2 flex flex-col h-full overflow-y-auto">
            
            {/* Header: Vehicle & OTP */}
            <div className="flex justify-between items-start mt-2 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{vehicleModel}</h2>
                    <div className="mt-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded border border-yellow-500 inline-block">
                        {vehicleNumber}
                    </div>
                </div>
                
                {/* OTP Box */}
                {!isInProgress && (
                    <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start OTP</span>
                        <span className="text-2xl font-black text-slate-900 tracking-widest leading-none mt-1">{otp}</span>
                    </div>
                )}
            </div>

            <div className="h-px w-full bg-slate-100 mb-6" />

            {/* Driver Profile */}
            <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={driverPhoto} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">{driverName[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate capitalize">{driverName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-green-100 text-green-700 hover:bg-green-100 border-0">
                            <Star className="w-3 h-3 fill-green-700 mr-1" /> {driverRating}
                        </Badge>
                        <span className="text-xs text-slate-400 font-medium">• Vaccinated</span>
                    </div>
                </div>

                <a href={`tel:${ride.driverPhone}`}>
                    <Button size="icon" className="rounded-full h-12 w-12 bg-green-500 hover:bg-green-600 shadow-green-200 shadow-lg active:scale-95 transition-transform">
                        <Phone className="w-5 h-5 text-white" />
                    </Button>
                </a>
            </div>

            {/* Location Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-red-500 shrink-0">
                    <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop Location</p>
                    <p className="text-sm font-bold text-slate-900 truncate leading-snug">{ride.destination?.address}</p>
                </div>
            </div>

            {/* 🔥 BUTTONS SECTION */}
            <div className="space-y-3">
                
                {/* 1. Google Maps Button (Visible Inside Card) */}
                <Button 
                    variant="outline" 
                    onClick={openGoogleMaps}
                    className="w-full h-12 rounded-xl font-bold border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm"
                >
                    <Navigation className="w-4 h-4 text-blue-600" />
                    {isInProgress ? "Track Ride on Maps" : "Track Captain"}
                </Button>

                {/* 2. Cancel / Share Button */}
                {!isInProgress ? (
                    <Button 
                        variant="ghost" 
                        onClick={onCancel} 
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold h-12 rounded-xl text-base"
                    >
                        <XCircle className="w-5 h-5 mr-2" /> Cancel Ride
                    </Button>
                ) : (
                    <Button 
                        className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold h-12 rounded-xl text-base shadow-lg flex items-center justify-center gap-2"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Track my ride',
                                    text: `I am in a ${vehicleModel} (${vehicleNumber}). Track me here:`,
                                    url: window.location.href
                                })
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4" /> Share Ride Details
                    </Button>
                )}
            </div>

        </div>
      </motion.div>
    </div>
  );
}