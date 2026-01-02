'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    X, Clock, Navigation, Wallet, Info, 
    QrCode as QrIcon, Phone, Star
} from 'lucide-react'; 
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import QRCode from "react-qr-code"; 
import { motion, AnimatePresence } from 'framer-motion';
import type { RideData } from '@/lib/types';
import { generateInvoiceID } from '@/utils/invoiceHelper';

interface RidePaymentViewProps {
    ride: RideData;
    driver: any; 
    riderName: string;
    riderPhoto: string;
    onConfirmPayment: () => void; 
    onFinish: () => void;
}

export function RidePaymentView({ ride, driver, riderName, riderPhoto, onConfirmPayment, onFinish }: RidePaymentViewProps) {
    const [showFullQR, setShowFullQR] = useState(false);
    const r = ride as any;

    const invoiceData = useMemo(() => {
        const rideDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date();
        const customID = generateInvoiceID(driver?.phone || "000", driver?.vehicleNumber || "0000", r.tripSequence || 1);
        return {
            date: rideDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            time: rideDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            id: customID,
        };
    }, [r.createdAt, r.tripSequence, driver]);

    // Financial Logic
    const totalAmount = Number(r.fare) || 0;
    const waitingCharge = 0; 
    const baseFareComponent = Math.min(Math.round(totalAmount * 0.30), 50); 
    const distanceFareComponent = totalAmount - baseFareComponent - waitingCharge;
    const baseFareForTax = totalAmount / 1.05; 
    const tdsAmount = baseFareForTax * 0.01;
    const netEarnings = baseFareForTax - tdsAmount;
    const isCashRide = (r.paymentMethod || 'cash') === 'cash';

    // 🔥 User Details Logic
    const riderPhone = r.riderPhone || r.userPhone || "No Number";
    const riderRating = r.riderRating || "4.8"; // Default rating if missing

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-[#050505] flex flex-col h-full font-sans overflow-hidden">
            
            {/* Full Screen QR Modal */}
            <AnimatePresence>
                {showFullQR && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-6" onClick={() => setShowFullQR(false)}>
                        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm text-center relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setShowFullQR(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full"><X className="w-5 h-5"/></button>
                            <div className="bg-white p-2 border-2 border-zinc-100 rounded-2xl inline-block mb-4 shadow-sm">
                                <QRCode value={`upi://pay?pa=${driver?.upiId}&pn=${driver?.name}&am=${totalAmount}`} size={240} />
                            </div>
                            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter">₹{totalAmount}</h1>
                            <p className="text-sm font-bold text-zinc-400 mt-2">Scan to Pay Driver</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-10 pb-48 flex flex-col items-center">
                
                {/* Top Status Bar */}
                <div className="w-full max-w-sm flex justify-between items-center mb-6 px-2 text-white">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isCashRide ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isCashRide ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                        <span className={`text-[10px] font-bold tracking-widest uppercase opacity-90 ${isCashRide ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {isCashRide ? 'Collect Cash' : 'Online Paid'}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{invoiceData.id}</span>
                </div>

                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm relative">
                    <div className="bg-[#121212] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        
                        {/* 1. HEADER (Now with Phone & Rating) */}
                        <div className="p-6 text-center border-b border-white/5 bg-white/[0.02]">
                            <div className="relative inline-block mb-3">
                                <Avatar className="w-20 h-20 border-2 border-emerald-500/50 p-1 bg-zinc-900">
                                    <AvatarImage src={riderPhoto} className="rounded-full object-cover" />
                                    <AvatarFallback className="text-3xl font-black text-white bg-emerald-600">
                                        {riderName ? riderName.charAt(0).toUpperCase() : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Rating Badge */}
                                <div className="absolute -bottom-2 -right-2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-md">
                                    <span>{riderRating}</span>
                                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-white tracking-tight">{riderName}</h2>
                            
                            {/* Phone & Date Row */}
                            <div className="flex justify-center items-center gap-3 mt-3">
                                <a href={`tel:${riderPhone}`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-white/80">{riderPhone}</span>
                                </a>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{invoiceData.time}</span>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* 2. Timeline */}
                            <div className="space-y-4 mb-6 relative pl-2">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />
                                <div className="flex items-start gap-3 relative">
                                    <div className="w-4 h-4 rounded-full bg-zinc-900 border-[3px] border-blue-500 shadow-sm z-10 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Picked Up</p>
                                        <p className="text-xs font-bold text-white/90 line-clamp-2">{r.pickup?.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 relative">
                                    <div className="w-4 h-4 rounded-full bg-zinc-900 border-[3px] border-emerald-500 shadow-sm z-10 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Dropped Off</p>
                                        <p className="text-xs font-bold text-white/90 line-clamp-2">{r.destination?.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Fare Breakdown */}
                            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-3 opacity-60">
                                    <Info className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Fare Breakdown</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-medium text-white/80">
                                        <span>Base Fare</span>
                                        <span>₹{baseFareComponent}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-medium text-white/80">
                                        <span>Distance Fare ({r.distance || 0} km)</span>
                                        <span>₹{distanceFareComponent}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-medium text-white/80">
                                        <span>Waiting Fee</span>
                                        <span>₹{waitingCharge}</span>
                                    </div>
                                    <div className="w-full h-[1px] bg-white/10 my-2" />
                                    <div className="flex justify-between items-center text-sm font-black text-white">
                                        <span>Total</span>
                                        <span>₹{totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Earnings Card */}
                            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white relative overflow-hidden mb-4 shadow-lg shadow-emerald-900/50">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1 opacity-80">
                                        <Wallet className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Partner Payout</span>
                                    </div>
                                    <h1 className="text-5xl font-black tracking-tighter mb-4">₹{netEarnings.toFixed(0)}</h1>
                                    
                                    <div className="w-full h-[1px] bg-white/20 mb-3" />
                                    
                                    <div className="flex justify-between items-center text-[10px] font-bold opacity-90">
                                        <span>Customer Bill</span>
                                        <span>₹{totalAmount.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-white/60 mt-1">
                                        <span>TDS Deducted (1%)</span>
                                        <span>- ₹{tdsAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Scan QR Button */}
                            <button className="w-full flex items-center gap-4 bg-white/[0.03] active:bg-white/10 p-4 rounded-2xl border border-white/5 transition-colors" onClick={() => setShowFullQR(true)}>
                                <div className="p-2 bg-white rounded-xl"><QRCode value={`upi://pay?pa=${driver?.upiId}`} size={40} /></div>
                                <div className="flex-1 text-left">
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">Scan to Pay</p>
                                    <p className="text-xs font-black text-white truncate text-emerald-400">Tap to expand QR</p>
                                </div>
                                <QrIcon className="text-white/20 w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pointer-events-none pt-12">
                <div className="max-w-sm mx-auto flex gap-4 pointer-events-auto">
                    <Button 
                        className={`flex-1 h-16 text-white font-black text-xl rounded-[1.8rem] shadow-xl tracking-widest uppercase border-4 ${
                            isCashRide 
                            ? 'bg-orange-500 hover:bg-orange-600 border-orange-700' 
                            : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-800'
                        }`} 
                        onClick={onConfirmPayment}
                    >
                        {isCashRide ? (
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span>COLLECT ₹{totalAmount}</span>
                                <span className="text-[9px] opacity-80 tracking-normal font-bold">THEN CLICK SETTLE</span>
                            </div>
                        ) : "SETTLEMENT"}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}