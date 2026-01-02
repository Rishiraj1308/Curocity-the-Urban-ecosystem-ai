'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, Download, Star, Loader2, IndianRupee, 
    Navigation, Clock, ShieldCheck, MapPin, QrCode
} from 'lucide-react'; 
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import type { RideData } from '@/lib/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { generateInvoiceID } from '@/utils/invoiceHelper';

interface UserRideBillProps {
    ride: RideData;
    onPaymentComplete: (method: 'upi' | 'cash') => void;
    onRateDriver: (stars: number) => void;
}

export default function UserRideBill({ ride, onPaymentComplete, onRateDriver }: UserRideBillProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [rating, setRating] = useState(0);

    const r = ride as any;

    const invoiceData = useMemo(() => {
        const rideDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date();
        const customID = generateInvoiceID(r.driverPhone || "000", r.driverVehicleNumber || "0000", r.tripSequence || 1);
        return {
            id: customID,
            date: rideDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            time: rideDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
    }, [r.createdAt, r.driverPhone, r.driverVehicleNumber, r.tripSequence]);

    const totalAmount = Number(r.fare) || 0;
    const baseFare = totalAmount / 1.05;
    const gstAmount = totalAmount - baseFare;

    const handlePayUPI = () => {
        window.location.href = `upi://pay?pa=${r.driverUpi}&pn=${r.driverName}&am=${totalAmount}&cu=INR`;
        setTimeout(() => onPaymentComplete('upi'), 5000); 
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col h-full font-sans overflow-hidden">
            
            <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-10 pb-64 flex flex-col items-center">
                
                <div className="w-full max-w-sm flex justify-between items-center mb-8 px-2">
                    <div className="flex items-center gap-2 bg-slate-900/5 border border-slate-900/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-black text-slate-900/60 tracking-widest uppercase italic">Arrived Safe</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900/30 tracking-widest uppercase italic">{invoiceData.id}</span>
                </div>

                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm relative">
                    
                    <div id="user-invoice-receipt" className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
                        
                        <div className="p-8 text-center bg-slate-50/50 border-b border-slate-100">
                            <div className="relative inline-block mb-4">
                                <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-1 ring-slate-100">
                                    <AvatarImage src={r.driverPhotoUrl} className="object-cover" />
                                    {/* 🔥 FIXED: Driver ka pehla letter */}
                                    <AvatarFallback className="bg-blue-600 text-white font-black text-3xl">
                                        {r.driverName ? r.driverName.charAt(0).toUpperCase() : 'D'}
                                    </AvatarFallback>
                                </Avatar>
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -bottom-1 -right-1 bg-yellow-400 p-2 rounded-full border-4 border-white shadow-lg">
                                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                                </motion.div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{r.driverName}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-[0.2em]">{invoiceData.date} • {invoiceData.time}</p>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100/50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Distance</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tight">{r.distance || '--'} <span className="text-[10px] font-medium opacity-50">KM</span></p>
                                </div>
                                <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100/50">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Time Taken</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tight">{r.duration || '--'} <span className="text-[10px] font-medium opacity-50">MIN</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group mb-8 shadow-2xl shadow-blue-900/10">
                                <div className="relative z-10 flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Total Fare</span>
                                    <div className="flex items-center gap-1">
                                        <IndianRupee className="w-7 h-7 text-blue-400 stroke-[3]" />
                                        <h1 className="text-7xl font-black tracking-tighter">{(totalAmount).toFixed(0)}</h1>
                                    </div>
                                    
                                    <div className="mt-6 pt-5 border-t border-white/5 w-full flex justify-between text-[11px] font-bold">
                                        <div className="flex flex-col">
                                            <span className="opacity-40 uppercase text-[8px] tracking-widest mb-0.5">Base Fare</span>
                                            <span>₹{baseFare.toFixed(2)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="opacity-40 uppercase text-[8px] tracking-widest mb-0.5">Tax (5% GST)</span>
                                            <span className="text-blue-400">₹{gstAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-[-50%] right-[-20%] w-56 h-56 bg-blue-600/20 blur-[70px] rounded-full group-hover:scale-125 transition-transform duration-700" />
                            </div>

                            <div className="space-y-6 relative border-l-2 border-dashed border-slate-100 ml-2 pl-7 py-2">
                                <div className="relative">
                                    <div className="absolute -left-[35px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 ring-4 ring-slate-50" />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Picked from</p>
                                    <p className="text-xs font-bold text-slate-600 line-clamp-1 italic">{r.pickup?.address}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[35px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-slate-50 shadow-lg shadow-blue-200" />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Dropped to</p>
                                    <p className="text-xs font-bold text-slate-600 line-clamp-1 italic">{r.destination?.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div initial={{ y: 150 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl p-8 rounded-t-[4rem] shadow-[0_-20px_80px_rgba(0,0,0,0.06)] z-[110] border-t border-slate-100 flex flex-col items-center">
                <div className="flex justify-center gap-5 mb-8">
                    {[1, 2, 3, 4, 5].map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.8 }} transition={{ type: "spring", stiffness: 400 }} onClick={() => {setRating(s); onRateDriver(s);}}>
                            <Star className={`w-11 h-11 transition-all duration-300 ${s <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-slate-100 fill-slate-50 hover:fill-slate-100'}`} />
                        </motion.button>
                    ))}
                </div>

                <div className="flex gap-4 w-full max-w-sm">
                    <Button onClick={handlePayUPI} className="flex-1 h-18 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-[2.2rem] shadow-[0_20px_40px_rgba(37,99,235,0.25)] transition-all active:scale-95">
                        PAY VIA UPI
                    </Button>
                    <Button variant="outline" className="h-18 w-18 rounded-[2.2rem] border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" onClick={() => onPaymentComplete('cash')}>
                        <QrCode className="w-7 h-7" />
                    </Button>
                </div>
                
                <button onClick={() => onPaymentComplete('cash')} className="mt-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-blue-600 transition-colors italic">
                    Already paid in cash? Tap here
                </button>
            </motion.div>
        </motion.div>
    );
}