'use client';

import React from 'react';
import { 
  Gem, Wrench, HeartPulse, ShieldCheck, 
  ChevronRight, Stethoscope, CarFront 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';

export const BenefitsTab = ({ data }: any) => {
    
    // Logic: Calculate Tier based on Rating
    const rating = parseFloat(data?.rating || "5.0");
    const tier = rating >= 4.8 ? "Platinum" : rating >= 4.5 ? "Gold" : "Silver";
    const nextTierProgress = rating >= 4.8 ? 100 : (rating / 5) * 100;
    
    const insuranceActive = !!data?.insurance?.policyNumber;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#050505] min-h-full pb-32 pt-6 px-5 overflow-y-auto h-full"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black text-white tracking-tight">Partner Perks<span className="text-purple-500">.</span></h1>
                <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest">
                    {tier} Tier
                </div>
            </div>

            {/* 1. TIER MEMBERSHIP CARD */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-900 via-[#1a0b2e] to-black border border-purple-500/30 p-6 mb-6 shadow-2xl group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] -mr-10 -mt-10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5">
                            <Gem className="w-6 h-6 text-purple-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-none">{tier} Partner</h2>
                            <p className="text-xs text-purple-300 mt-1">Unlock higher earnings</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-purple-200/70 font-bold uppercase tracking-widest">
                            <span>Current Rating: {rating}</span>
                            <span>Target: 5.0</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${nextTierProgress}%` }} 
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Maintained 4.8+ rating. You have priority support access.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                
                {/* 2. INSURANCE VAULT (Real Data) */}
                <div className="bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-500/20 rounded-[2rem] p-1 relative overflow-hidden">
                    <div className="bg-[#121212]/90 backdrop-blur-sm p-5 rounded-[1.8rem]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                    <ShieldCheck className="w-6 h-6 text-blue-400"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">Curocity Cover</h3>
                                    <p className="text-xs text-gray-500">Accidental Insurance</p>
                                </div>
                            </div>
                            <Badge className={`${insuranceActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} border px-3`}>
                                {insuranceActive ? "ACTIVE" : "EXPIRED"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Policy Number</p>
                                <p className="text-sm font-mono text-white tracking-wide">{data?.insurance?.policyNumber || "PENDING"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Valid Till</p>
                                <p className="text-sm font-bold text-white">{data?.insurance?.expiryDate || "Dec 2025"}</p>
                            </div>
                        </div>

                        <div className="h-px w-full bg-white/5 mb-4" />
                        
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Sum Insured</p>
                                <p className="text-xl font-black text-white tracking-tight">₹5,00,000</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                                View Policy <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. ACTIVE SERVICES GRID */}
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2 pt-2">Active Services</h3>
                
                <div className="grid grid-cols-1 gap-3">
                    {/* ResQ Card */}
                    <Card className="bg-[#121212] border-white/10 text-white hover:border-emerald-500/30 transition-colors group">
                        <div className="flex p-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                                    <CarFront className="w-6 h-6 text-emerald-500"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Roadside ResQ</h4>
                                    <p className="text-xs text-gray-400">2 Free breakdowns / month</p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl h-9">
                                Request
                            </Button>
                        </div>
                    </Card>

                    {/* Medical Checkup Card */}
                    <Card className="bg-[#121212] border-white/10 text-white hover:border-red-500/30 transition-colors group">
                        <div className="flex p-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl group-hover:bg-red-500/20 transition-colors">
                                    <Stethoscope className="w-6 h-6 text-red-500"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Doctor on Call</h4>
                                    <p className="text-xs text-gray-400">Free consultation active</p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl h-9">
                                Book
                            </Button>
                        </div>
                    </Card>
                </div>

            </div>
        </motion.div>
    );
};