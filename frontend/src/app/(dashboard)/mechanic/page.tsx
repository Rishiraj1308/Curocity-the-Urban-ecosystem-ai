'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, onSnapshot, GeoPoint, serverTimestamp, runTransaction } from 'firebase/firestore'
import { useFirebase } from '@/lib/firebase/client-provider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { History, IndianRupee, Navigation, CheckCircle, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// 🔥 FIX: Correct path to your 'maps' component
const LiveMap = dynamic(() => import('@/components/maps'), { ssr: false });

export default function MechanicDashboardPage() {
    const { db, auth } = useFirebase();
    const [activeJob, setActiveJob] = useState<any | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [enteredOtp, setEnteredOtp] = useState('');

    useEffect(() => {
        const sessionData = localStorage.getItem('curocity-resq-session');
        if (sessionData) setSession(JSON.parse(sessionData));
        setIsLoading(false);
    }, []);

    // Live Location Tracking for Mechanics
    useEffect(() => {
        if (!db || !session?.userId || !session?.isOnline) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                updateDoc(doc(db, 'mechanics', session.userId), {
                    currentLocation: new GeoPoint(pos.coords.latitude, pos.coords.longitude),
                    lastSeen: serverTimestamp()
                });
            },
            () => toast.error("Location tracking failed"),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [db, session?.userId, session?.isOnline]);

    const handleAvailabilityChange = async (checked: boolean) => {
        if (!db || !session?.userId) return;
        try {
            await updateDoc(doc(db, 'mechanics', session.userId), { isOnline: checked });
            const newSession = { ...session, isOnline: checked };
            setSession(newSession);
            localStorage.setItem('curocity-resq-session', JSON.stringify(newSession));
            toast(checked ? "ONLINE" : "OFFLINE");
        } catch (e) {
            toast.error("Status update failed");
        }
    };

    if (isLoading) return <Skeleton className="h-full w-full" />;

    return (
        <div className="p-6 space-y-6 bg-[#050505] min-h-screen text-white">
            <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="italic font-black uppercase">ResQ Dashboard</CardTitle>
                    <div className="flex items-center gap-2">
                        <Switch checked={session?.isOnline} onCheckedChange={handleAvailabilityChange} />
                        <Label className="text-[10px] font-bold uppercase">{session?.isOnline ? "Online" : "Offline"}</Label>
                    </div>
                </CardHeader>
                <CardContent className="h-64 relative overflow-hidden rounded-2xl">
                    {/* Maps placeholder with active user location */}
                    <LiveMap activePartners={[]} /> 
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-white/10 p-4">
                    <History className="text-emerald-500 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Today's Jobs</p>
                    <p className="text-2xl font-black italic">0</p>
                </Card>
                <Card className="bg-zinc-900/50 border-white/10 p-4">
                    <IndianRupee className="text-emerald-500 mb-2" />
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Earnings</p>
                    <p className="text-2xl font-black italic">₹0</p>
                </Card>
            </div>
        </div>
    );
}