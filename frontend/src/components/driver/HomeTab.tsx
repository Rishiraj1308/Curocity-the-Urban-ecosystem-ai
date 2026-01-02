'use client';
import React from 'react';
import { Power, Bell, X, Navigation, Phone, CheckCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveMap from "@/components/maps/LiveMap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ✅ Yahan maine 'setRequests' ko props mein add kar diya hai
export const HomeTab = ({ 
    isOnline, setIsOnline, requests, setRequests, activeRide, 
    handleAccept, updateStatus, openGoogleMaps, currentLocation 
}: any) => (
    <div className="relative h-full w-full bg-[#050505]">
        
        {/* Map Layer */}
        <div className={`absolute inset-0 z-0 transition-all duration-700 ${!isOnline && !activeRide ? 'opacity-30 grayscale blur-[2px]' : 'opacity-100'}`}>
            <LiveMap 
               driverLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : undefined}
               pickupLocation={activeRide?.pickup?.location ? [activeRide.pickup.location.latitude, activeRide.pickup.location.longitude] : undefined}
               dropLocation={activeRide?.destination?.location ? [activeRide.destination.location.latitude, activeRide.destination.location.longitude] : undefined}
               routeCoordinates={null} 
            />
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
        </div>

        {/* Top Status */}
        <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="flex items-center gap-3 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full py-2 px-6 shadow-2xl pointer-events-auto">
                <div className={`flex items-center gap-2 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{isOnline ? 'System Online' : 'Offline'}</span>
                </div>
            </div>
        </div>

        {/* Offline Button */}
        {!isOnline && !activeRide && (
            <div className="absolute bottom-32 left-0 right-0 px-6 z-20 flex justify-center pointer-events-auto">
                <button 
                    onClick={() => setIsOnline(true)}
                    className="group relative w-full max-w-xs h-16 bg-white text-black font-black text-xl rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 active:scale-95 transition-transform overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Power className="w-6 h-6" /> GO ONLINE
                </button>
            </div>
        )}

        {/* Searching Radar */}
        {isOnline && !activeRide && requests.length === 0 && (
            <div className="absolute bottom-32 left-0 right-0 px-6 z-20 flex flex-col items-center gap-4 pointer-events-auto">
                <div className="bg-[#121212]/90 backdrop-blur-md border border-cyan-500/30 px-8 py-4 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(6,182,212,0.2)] w-full max-w-sm justify-center">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </div>
                    <span className="text-sm font-bold text-cyan-100 tracking-wide uppercase">Scanning Sector...</span>
                </div>
                <button onClick={() => setIsOnline(false)} className="bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-2 rounded-full text-xs font-bold backdrop-blur-md">ABORT</button>
            </div>
        )}

        {/* Incoming Request */}
        <AnimatePresence>
        {isOnline && requests.length > 0 && !activeRide && (
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="absolute bottom-0 w-full z-30 bg-[#121212] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-28 shadow-2xl pointer-events-auto"
            >
                {requests.map((ride: any) => (
                    <div key={ride.id} className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge className="bg-cyan-950 text-cyan-400 border border-cyan-800 mb-2 px-3 py-1 text-[10px] tracking-widest">{ride.rideType}</Badge>
                                <div className="text-5xl font-black text-white tracking-tighter">₹{ride.fare}</div>
                            </div>
                            <div className="text-right">
                                <div className="bg-white/10 p-2 rounded-xl inline-block"><Bell className="w-6 h-6 text-white animate-pulse" /></div>
                                <p className="text-xs text-gray-400 mt-2 font-mono">{ride.distance} KM AWAY</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="h-16 w-16 rounded-2xl border-white/10 bg-white/5" onClick={() => setRequests([])}><X className="w-6 h-6 text-gray-400" /></Button>
                            <Button className="flex-1 h-16 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)]" onClick={() => handleAccept(ride)}>ACCEPT MISSION</Button>
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
        </AnimatePresence>

        {/* Active Ride Panel */}
        <AnimatePresence>
        {activeRide && (
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} 
                className="absolute bottom-0 w-full z-30 bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-28 shadow-2xl pointer-events-auto"
            >
                {activeRide.status !== 'payment_pending' && (
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 border-2 border-white/10 rounded-2xl"><AvatarFallback>R</AvatarFallback></Avatar>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase">{activeRide.riderName}</h2>
                                <span className="text-[10px] font-bold bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">₹{activeRide.fare} • Cash</span>
                            </div>
                        </div>
                        <a href={`tel:${activeRide.riderPhone}`} className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10"><Phone size={20} className="text-white"/></a>
                    </div>
                )}

                {activeRide.status === 'accepted' && <Button onClick={() => { updateStatus('arriving'); openGoogleMaps(activeRide.pickup.location.latitude, activeRide.pickup.location.longitude); }} className="w-full h-16 bg-blue-600 font-bold rounded-2xl text-lg shadow-lg">Start Navigation</Button>}
                {activeRide.status === 'arriving' && <Button onClick={() => updateStatus('arrived')} className="w-full h-16 bg-amber-500 text-black font-bold rounded-2xl text-lg shadow-lg">I've Arrived</Button>}
                {activeRide.status === 'arrived' && <div className="flex gap-3"><div className="bg-white/5 px-6 rounded-2xl flex items-center justify-center min-w-[100px] border border-white/10 text-2xl font-mono font-black text-white">{activeRide.otp || '----'}</div><Button onClick={() => { updateStatus('in-progress'); openGoogleMaps(activeRide.destination.location.latitude, activeRide.destination.location.longitude); }} className="flex-1 h-16 bg-emerald-500 text-black font-bold rounded-2xl text-lg shadow-lg">Start Trip</Button></div>}
                {activeRide.status === 'in-progress' && <Button onClick={() => updateStatus('payment_pending')} className="w-full h-16 bg-red-600 text-white font-bold rounded-2xl text-lg shadow-lg">Complete Trip</Button>}
                {activeRide.status === 'payment_pending' && (
                    <div className="text-center pt-2">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/30"><CheckCircle className="w-10 h-10 text-emerald-500" /></div>
                        <h3 className="text-5xl font-black text-white mb-2 tracking-tighter">₹{activeRide.fare}</h3>
                        <Button onClick={() => updateStatus('completed')} className="w-full h-16 bg-white text-black font-bold rounded-2xl text-lg shadow-xl">Confirm Receipt</Button>
                    </div>
                )}
            </motion.div>
        )}
        </AnimatePresence>
    </div>
);