'use client'

import { useState, useEffect, useMemo } from 'react';
import { 
    Car, Wrench, Shield, Ambulance, Route, CircleDot, Activity, 
    Users, View, User as UserIcon, MapPinned, Hospital, Zap, Loader2 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/lib/firebase/client-provider'; // Unified hook
import { collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

// 🔥 FIX: Import path changed to 'maps' to match your folder structure
const LiveMap = dynamic(() => import('@/components/maps'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted flex items-center justify-center"><p>Loading Radar...</p></div>
});

export type EntityStatus =
    | 'online'
    | 'on_trip'
    | 'available'
    | 'sos_mechanical'
    | 'sos_medical'
    | 'sos_security';

export interface ActiveEntity {
    id: string;
    name: string;
    type: 'driver' | 'mechanic' | 'ambulance' | 'rider' | 'hospital';
    status?: EntityStatus | string;
    location: {
        lat: number;
        lon: number;
    };
    phone?: string;
    vehicle?: string;
}

const legendItems = [
    { icon: Hospital, label: 'Hospital (Cure Hub)', color: 'bg-indigo-500' },
    { icon: Ambulance, label: 'Cure Partner (Ambulance)', color: 'bg-red-500' },
    { icon: Car, label: 'Path Partner (Driver)', color: 'bg-emerald-500' },
    { icon: Wrench, label: 'ResQ Partner (Mechanic)', color: 'bg-yellow-500' },
    { icon: UserIcon, label: 'Rider (Customer)', color: 'bg-blue-500' },
];

export default function LiveMapPage() {
    const [allPartners, setAllPartners] = useState<ActiveEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHudVisible, setIsHudVisible] = useState(true);
    const { db, functions } = useFirebase(); // Using unified Firebase context

    useEffect(() => {
        async function fetchData() {
            if (!db) return;
            setIsLoading(true);

            const collectionsList = ['pathPartners', 'mechanics', 'ambulances', 'users'];
            const types: ActiveEntity['type'][] = ['driver', 'mechanic', 'ambulance', 'rider'];

            try {
                const allEntitiesData: ActiveEntity[] = [];

                const queries = collectionsList.map(async (collName, i) => {
                    const typeName = types[i];
                    let q;

                    if (collName === 'users') {
                        q = query(
                            collection(db, collName),
                            where('isOnline', '==', true),
                            where('role', '==', 'user')
                        );
                    } else {
                        q = query(collection(db, collName), where('isOnline', '==', true));
                    }

                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        // 🔥 FIX: Cast to any to avoid "unknown" type errors
                        const data = doc.data() as any;
                        const loc = data.currentLocation || data.location;

                        if (loc) {
                            allEntitiesData.push({
                                id: doc.id,
                                name: data.name || 'Unknown',
                                type: typeName,
                                status: data.status,
                                location: {
                                    lat: loc.latitude || loc.lat,
                                    lon: loc.longitude || loc.lon || loc.lng,
                                },
                                phone: data.phone,
                                vehicle: data.vehicleName || data.vehicleModel,
                            });
                        }
                    });
                });

                await Promise.all(queries);
                setAllPartners(allEntitiesData);
            } catch (error) {
                console.error('Error fetching live map data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [db]);

    const liveMetrics = useMemo(() => {
        return {
            activeDrivers: allPartners.filter(p => p.type === 'driver').length,
            activeResQ: allPartners.filter(p => p.type === 'mechanic').length,
            activeCure: allPartners.filter(p => p.type === 'ambulance').length,
            activeRiders: allPartners.filter(p => p.type === 'rider').length,
            sosAlerts: 0,
            ongoingTrips: allPartners.filter(p => p.status === 'on_trip').length,
        };
    }, [allPartners]);

    const handleSimulateDemand = async () => {
        if (!functions) {
            toast.error('Functions not available.');
            return;
        }

        const simulateHighDemand = httpsCallable(functions, 'simulateHighDemand');
        try {
            await simulateHighDemand({ zoneName: 'Cyber Hub, Gurgaon' });
            toast.success('Demand Simulated!', {
                description: 'A high-demand alert has been triggered.',
            });
        } catch (error) {
            toast.error('Simulation Failed');
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-64px)] flex-1 bg-black overflow-hidden">
            {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                    <p className="text-zinc-500 text-xs uppercase tracking-widest italic animate-pulse">Syncing Global Fleet...</p>
                </div>
            ) : (
                <div className="absolute inset-0">
                    {/* 🔥 FIX: Passing activePartners correctly to the Maps component */}
                    <LiveMap activePartners={allPartners} />
                </div>
            )}

            {/* CONTROL PANEL */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10" onClick={() => setIsHudVisible(!isHudVisible)}>
                    <View className="mr-2 h-4 w-4" />
                    {isHudVisible ? 'Hide HUD' : 'Show HUD'}
                </Button>
                <Button onClick={handleSimulateDemand} variant="outline" className="bg-black/40 border-amber-500/50 text-amber-500">
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                    Simulate Surge
                </Button>
            </div>

            {/* HUD DISPLAYS */}
            {isHudVisible && !isLoading && (
                <>
                    <div className="absolute top-20 left-4 z-10 w-64 space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                            <h3 className="font-black italic uppercase tracking-tighter text-emerald-500 mb-3">Mission Stats</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Riders', val: liveMetrics.activeRiders, icon: UserIcon },
                                    { label: 'Drivers', val: liveMetrics.activeDrivers, icon: Car },
                                    { label: 'ResQ', val: liveMetrics.activeResQ, icon: Wrench },
                                    { label: 'Cure', val: liveMetrics.activeCure, icon: Ambulance },
                                ].map(m => (
                                    <div key={m.label} className="bg-white/5 p-2 rounded-xl border border-white/5">
                                        <p className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1"><m.icon size={10}/> {m.label}</p>
                                        <p className="text-xl font-black">{m.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-6 z-10 w-64 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
                                <MapPinned size={14} /> Intelligence Legend
                            </h3>
                            <div className="space-y-2">
                                {legendItems.map(item => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg shadow-black/50`} />
                                        <span className="text-[10px] font-bold uppercase text-zinc-300">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}