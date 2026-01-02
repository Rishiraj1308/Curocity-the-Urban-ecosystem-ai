'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, MapPin, Wallet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ShiftSummaryProps {
    open: boolean;
    onClose: () => void;
    stats: {
        earnings: string;
        rides: number;
        hours: string;
    };
}

export function ShiftSummary({ open, onClose, stats }: ShiftSummaryProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center text-slate-900">Shift Ended!</DialogTitle>
                    <p className="text-slate-500 text-sm text-center">Great job today, Captain.</p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Wallet className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase">Earnings</p>
                        <p className="text-2xl font-black text-slate-900">₹{stats.earnings}</p>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Trips</p>
                                <p className="font-bold text-slate-900">{stats.rides}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Hours</p>
                                <p className="font-bold text-slate-900">{stats.hours}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full h-12 text-lg font-bold bg-slate-900">
                        Done & Rest
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}