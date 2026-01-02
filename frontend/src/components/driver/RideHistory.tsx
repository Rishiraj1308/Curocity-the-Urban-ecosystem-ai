'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, ChevronRight, Clock, Receipt, History } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirebase } from '@/lib/firebase/client-provider';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'; // Removed orderBy for now if index missing
import { useDriver } from '@/context/DriverContext';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function RideHistory() {
  const { db } = useFirebase();
  const { partnerData } = useDriver();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!db || !partnerData?.id) return;
      try {
        // 🔥 IMPROVED QUERY: Simple query first (Client side filtering/sorting is safer without Indexes)
        const q = query(
            collection(db, "rides"), 
            where("driverId", "==", partnerData.id) // Sirf iss driver ki rides
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 🔥 CLIENT SIDE SORTING (Kyuki Firestore Index error de sakta hai abhi)
        const sortedData = data.sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA; // Newest first
        });

        setRides(sortedData); 
      } catch (error) {
        console.error("History Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [db, partnerData]);

  const filteredRides = rides.filter(ride => {
      // Status normalization
      const status = ride.status || '';
      if (filter === 'all') return ['completed', 'cancelled_by_driver', 'cancelled_by_rider', 'archived', 'payment_pending'].includes(status);
      if (filter === 'completed') return ['completed', 'archived', 'payment_pending'].includes(status);
      if (filter === 'cancelled') return status.includes('cancelled');
      return false;
  });

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      
      {/* Header & Filter */}
      <div className="p-5 bg-white sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-6 h-6"/> Trip History
        </h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Completed', 'Cancelled'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f.toLowerCase() as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                        filter === f.toLowerCase() 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-24">
        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />)}
            </div>
        ) : filteredRides.length === 0 ? (
            <div className="text-center mt-20 opacity-50">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-700">No Trips Found</h3>
                <p className="text-sm text-slate-400">Complete a ride to see it here.</p>
            </div>
        ) : (
            filteredRides.map((ride) => (
                <HistoryCard key={ride.id} ride={ride} />
            ))
        )}
      </div>
    </div>
  );
}

// Single Ride Card Component
function HistoryCard({ ride }: { ride: any }) {
    const isCompleted = ['completed', 'archived', 'payment_pending'].includes(ride.status);
    
    // Date formatting (Safe)
    let dateStr = 'Date N/A';
    if (ride.createdAt?.toDate) {
        dateStr = format(ride.createdAt.toDate(), 'dd MMM, hh:mm a');
    } else if (ride.createdAt) {
        // Fallback for timestamp
        dateStr = format(new Date(ride.createdAt), 'dd MMM, hh:mm a'); 
    }

    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
            <CardContent className="p-0">
                {/* Top Strip */}
                <div className={`h-1.5 w-full ${isCompleted ? 'bg-green-500' : 'bg-red-500'}`} />
                
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{dateStr}</p>
                            <h3 className="text-xl font-black text-slate-900">₹{ride.fare}</h3>
                        </div>
                        <Badge variant="outline" className={`px-2 py-1 rounded-lg border-0 font-bold ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCompleted ? 'Completed' : 'Cancelled'}
                        </Badge>
                    </div>

                    <div className="space-y-4 relative pl-4 border-l-2 border-slate-100 ml-1 mb-5">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Pickup</p>
                            <p className="text-sm font-semibold text-slate-700 line-clamp-1">{ride.pickup?.address}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-900 ring-4 ring-white" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Drop</p>
                            <p className="text-sm font-semibold text-slate-700 line-clamp-1">{ride.destination?.address}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                            {ride.distance && <span className="flex items-center gap-1">📍 {ride.distance} km</span>}
                            {ride.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ride.duration} min</span>}
                        </div>
                        
                        {/* View Receipt */}
                        {isCompleted && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2">
                                        View Receipt <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] p-0">
                                    <div className="bg-slate-900 text-white p-8 rounded-t-[2rem] text-center">
                                        <Receipt className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                                        <h2 className="text-3xl font-bold">₹{ride.fare}</h2>
                                        <p className="text-slate-400 text-sm mt-1">Paid via Cash</p>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-bold">{dateStr}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Ride ID</span><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{ride.id.slice(0,8)}</span></div>
                                        <div className="h-px bg-slate-100 my-2" />
                                        <div className="flex justify-between text-base font-bold"><span className="text-slate-900">Total Earned</span><span className="text-green-600">₹{ride.fare}</span></div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}