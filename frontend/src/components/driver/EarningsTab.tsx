'use client';

import React, { useState } from 'react';
import { ArrowUpRight, QrCode, Landmark, Copy, Wallet, Check, Pen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import QRCode from "react-qr-code"; 
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, updateDoc } from 'firebase/firestore';

export function EarningsTab({ data }: { data: any }) {
  const { db } = useFirebase();
  
  // State for UPI Editing
  const [isEditing, setIsEditing] = useState(false);
  const [upiId, setUpiId] = useState(data?.upiId || "");
  const [loading, setLoading] = useState(false);

  const driverName = data?.name || "Curocity Partner";
  
  // Generic Payment Link (User will enter amount)
  const qrValue = `upi://pay?pa=${upiId}&pn=${driverName}&cu=INR`;

  const copyUPI = () => {
      if(!upiId) return toast.error("No UPI ID linked!");
      navigator.clipboard.writeText(upiId);
      toast.success("UPI ID Copied!");
  }

  const handleSaveUPI = async () => {
      if (!upiId.includes('@')) {
          toast.error("Invalid UPI ID (e.g., name@oksbi)");
          return;
      }
      if (!db || !data?.id) return;

      setLoading(true);
      try {
          await updateDoc(doc(db, 'pathPartners', data.id), {
              upiId: upiId
          });
          toast.success("UPI ID Linked Successfully!");
          setIsEditing(false);
      } catch (error) {
          toast.error("Failed to link UPI");
      } finally {
          setLoading(false);
      }
  };

  const transactions = [
    { id: 1, amount: 500, status: 'Settled', date: 'Today, 2:00 PM' },
    { id: 2, amount: 1200, status: 'Settled', date: 'Yesterday, 8:00 PM' },
  ];

  return (
    <div className="p-6 pb-24 space-y-6 font-sans bg-slate-50 min-h-full">
      <h1 className="text-2xl font-black text-slate-900">My Earnings</h1>

      {/* EARNINGS & QR CARD */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-[50px] -mr-10 -mt-10" />
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Unsettled Balance</p>
                    <h2 className="text-5xl font-black tracking-tighter">₹{data?.totalEarnings || '0'}</h2>
                </div>
                
                {/* QR CODE (Only shows if UPI is linked) */}
                <div className="bg-white p-2 rounded-xl shadow-lg">
                    <div className="h-20 w-20 flex items-center justify-center bg-slate-100 rounded text-black text-[10px] font-bold">
                        {upiId ? (
                            <QRCode 
                                value={qrValue} 
                                style={{ height: "100%", width: "100%", maxWidth: "100%" }} 
                                viewBox={`0 0 256 256`}
                            />
                        ) : "Link UPI"}
                    </div>
                </div>
            </div>
            
            {/* 🔥 LINK UPI SECTION */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 mb-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                        <QrCode className="w-3 h-3" /> Linked UPI ID
                    </p>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="text-[10px] bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition">
                            Change
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(false)} className="text-[10px] text-red-400 hover:text-red-300 transition">
                            Cancel
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex gap-2">
                        <Input 
                            value={upiId} 
                            onChange={(e) => setUpiId(e.target.value)} 
                            placeholder="e.g. mobile@paytm" 
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-10"
                        />
                        <Button size="icon" className="bg-green-500 hover:bg-green-600 shrink-0" onClick={handleSaveUPI} disabled={loading}>
                            <Check className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-white font-mono truncate max-w-[200px]">
                            {upiId || <span className="text-slate-500 italic text-sm">No UPI Linked</span>}
                        </p>
                        {upiId && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={copyUPI}>
                                <Copy className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
                * Payments will be sent directly to this UPI ID. Double check before saving.
            </p>
        </div>
      </div>

      {/* PAYOUT HISTORY */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Settlements</h3>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {transactions.map((t) => (
                <div key={t.id} className="p-4 border-b border-slate-50 last:border-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-full text-slate-500">
                            <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Transfer to Bank</p>
                            <p className="text-xs text-slate-400">{t.date}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-900">-₹{t.amount}</p>
                        <span className={`text-[10px] font-bold ${t.status === 'Settled' ? 'text-green-600' : 'text-orange-500'}`}>
                            {t.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}