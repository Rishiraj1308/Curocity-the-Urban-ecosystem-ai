'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Menu, Wallet, Power, Crosshair, User, Gift, History, FileText, 
    LogOut, ChevronRight, ArrowLeft, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, setDoc, updateDoc, GeoPoint, collection, query, where, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore'; 
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useDriver } from '@/context/DriverContext';
import { EcosystemHub } from '@/components/shared/EcosystemHub'; 
import { toast } from "sonner"; 
import dynamic from 'next/dynamic';

// Components
import { ProfileTab } from '@/components/driver/ProfileTab'; 
import { EarningsTab } from '@/components/driver/EarningsTab'; 
import { DocumentsTab } from '@/components/driver/DocumentsTab'; 
import { RideHistory } from '@/components/driver/RideHistory'; 
import { RidePopup } from '@/features/driver/components/RidePopup';
import { ActiveRideView } from '@/features/driver/components/ActiveRideView';
import { ShiftSummary } from '@/components/driver/ShiftSummary';

// Dynamic Map Import
const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse" />
});

const getCoords = (loc: any): [number, number] | undefined => {
    if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        return [loc.latitude, loc.longitude];
    }
    return undefined;
};

// Sub-components
const PendingVerificationView = ({ data, onLogout }: { data: any, onLogout: () => void }) => (
    <div className="h-[100dvh] w-full bg-[#020202] text-white flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-black italic uppercase">Verification Pending</h1>
        <p className="text-zinc-500 text-sm mt-2">Status: <span className="text-yellow-500 font-bold">{data?.status}</span></p>
        <Button variant="ghost" onClick={onLogout} className="mt-8 text-zinc-500 border border-zinc-800">Sign Out</Button>
    </div>
);

const OnlineScanner = ({ onStop, vehicleType }: { onStop: () => void, vehicleType: string }) => (
    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 flex items-center justify-center bg-blue-50 rounded-full">
                        <span className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                        <Crosshair className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">Scanning...</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase">Vehicle: <b className="text-blue-600">{vehicleType}</b></p>
                    </div>
                </div>
                <Button size="icon" className="rounded-full h-12 w-12 bg-red-50 text-red-500" onClick={onStop}><Power className="w-5 h-5" /></Button>
            </div>
        </div>
    </motion.div>
);

const RIDE_ALERT_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function DriverApp() {
  const router = useRouter();
  const { user, db, auth } = useFirebase();
  const { partnerData } = useDriver(); 
  
  const [isOnline, setIsOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'profile' | 'ecosystem' | 'history' | 'earnings' | 'documents'>('map');
  
  const [requests, setRequests] = useState<any[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { audioRef.current = new Audio(RIDE_ALERT_SOUND); audioRef.current.loop = true; }, []);
  useEffect(() => { if (requests.length > 0) audioRef.current?.play().catch(() => {}); else { audioRef.current?.pause(); if(audioRef.current) audioRef.current.currentTime = 0; } }, [requests]);
  
  useEffect(() => { if (partnerData) setIsOnline(partnerData.isOnline || false); }, [partnerData]);

  // 1. GPS Sync
  useEffect(() => {
    if (!navigator.geolocation || !isOnline || !user || !db) return;
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(loc);
          try { await setDoc(doc(db, 'pathPartners', user.uid), { currentLocation: new GeoPoint(loc.latitude, loc.longitude), lastActive: new Date(), isOnline: true }, { merge: true }); } catch (e) {}
      }, () => {}, { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [db, user, isOnline]);

  // 2. Ride Request Listener
  useEffect(() => {
    if (!db || !isOnline || activeRide) { setRequests([]); return; }
    
    const q = query(collection(db, "rides"), where("status", "==", "searching"));
    const unsub = onSnapshot(q, (snap) => {
        const allRides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const now = new Date().getTime();
        
        const validRides = allRides.filter((ride: any) => {
             const createdAt = ride.createdAt?.toDate ? ride.createdAt.toDate() : new Date(ride.createdAt || now);
             return (now - createdAt.getTime()) / 60000 <= 15;
        });

        if (validRides.length > 0) {
            setRequests(validRides);
        } else {
            setRequests([]);
        }
    });
    return () => unsub();
  }, [db, isOnline, activeRide]);

  // 3. ACTIVE RIDE LISTENER
  useEffect(() => {
    if (!db || !user) return;
    
    const activeStatuses = [
        "accepted", 
        "arriving", 
        "arrived",
        "in-progress", 
        "payment_pending",
        "completed" 
    ];
    
    const q = query(collection(db, "rides"), where("driverId", "==", user.uid), where("status", "in", activeStatuses));
    
    const unsub = onSnapshot(q, (snap) => {
      const rides = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const currentRide = rides.find(r => 
          r.status !== 'completed' || (r.status === 'completed' && r.paymentStatus !== 'paid')
      );
      
      if (currentRide) {
          setActiveRide(currentRide);
      } else {
          setActiveRide(null);
      }
    });
    return () => unsub();
  }, [db, user]);

  // Accept Logic (FIXED VEHICLE DETAILS)
  const handleAcceptRide = async (rideId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
        if (!db || !user || !partnerData) throw "App not ready";
        const rideRef = doc(db, "rides", rideId);
        const driverRef = doc(db, "pathPartners", user.uid);
        const rideSnap = await getDoc(rideRef);
        if (!rideSnap.exists()) throw "Ride disappeared";
        const rideData = rideSnap.data();
        
        if (rideData.status !== 'searching') {
             if (rideData.driverId === user.uid) {
                 toast.success("Recovering Ride...");
                 setIsProcessing(false);
                 return;
             }
             throw "Ride already taken";
        }

        await updateDoc(rideRef, {
            status: "accepted",
            driverId: user.uid,
            driverName: partnerData.name || "Captain",
            driverPhone: partnerData.phone || "",
            driverPhotoUrl: partnerData.photoUrl || "",
            
            // 🔥🔥 FIX: Correct Field Names for User App Match 🔥🔥
            driverCarNumber: partnerData.vehicleNumber || "UP16 XX 0000",
            driverCarModel: partnerData.vehicleModel || "Sedan",
            driverVehicleType: partnerData.vehicleType || "car",
            
            driverLocation: new GeoPoint(currentLocation?.latitude || 0, currentLocation?.longitude || 0),
            acceptedAt: serverTimestamp(),
            pendingDriverIds: [] 
        });

        await updateDoc(driverRef, { currentRideId: rideId, liveStatus: "on_trip", isOnline: true });
        toast.success("Ride Accepted!");
        
        // Optimistic Update
        setActiveRide({ ...rideData, id: rideId, status: 'accepted' });
        setRequests([]);
        
    } catch (e: any) {
        console.error("Accept Failed:", e);
        toast.error("Connection Failed");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleLogout = async () => { if (user?.uid && db) await setDoc(doc(db, 'pathPartners', user.uid), { isOnline: false }, { merge: true }); if (auth) auth.signOut(); router.push('/'); };
  const toggleStatus = async (val: boolean) => { if (!db || !user) return; setIsOnline(val); if(!val) setShowShiftSummary(true); await setDoc(doc(db, 'pathPartners', user.uid), { isOnline: val }, { merge: true }); };

  const forceResetDriver = async () => {
    if (!user || !db) return;
    await updateDoc(doc(db, 'pathPartners', user.uid), { currentRideId: null, liveStatus: 'online', isOnline: true });
    setActiveRide(null); setRequests([]); toast.success("Reset Done"); window.location.reload();
  };

  if (!partnerData) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  const status = partnerData.status?.toLowerCase().trim();
  if (status !== 'verified' && status !== 'online') return <PendingVerificationView data={partnerData} onLogout={handleLogout} />;

  if (activeView !== 'map') {
      return (
          <div className="h-[100dvh] bg-slate-50 flex flex-col">
              <div className="p-4 bg-white shadow-sm flex items-center gap-3 sticky top-0 z-50">
                  <Button variant="ghost" size="icon" onClick={() => setActiveView('map')}><ArrowLeft /></Button>
                  <h2 className="font-bold text-lg capitalize">{activeView}</h2>
              </div>
              <div className="flex-1 overflow-y-auto bg-black p-4">
                  {activeView === 'profile' && <ProfileTab data={partnerData} logout={handleLogout} />}
                  {activeView === 'ecosystem' && <EcosystemHub currentType="path" userData={{ uid: user!.uid, name: partnerData.name, phone: partnerData.phone, currentLocation }} />}
                  {activeView === 'earnings' && <EarningsTab data={partnerData} />}
                  {activeView === 'documents' && <DocumentsTab data={partnerData} />}
                  {activeView === 'history' && <RideHistory />}
              </div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] w-full bg-slate-200 relative overflow-hidden font-sans text-slate-900">
        {!activeRide && (
            <div className="absolute inset-0 z-0">
                {currentLocation ? (
                    <LiveMap 
                       key="driver-home-map"
                       driverLocation={getCoords(currentLocation)}
                       pickupLocation={undefined}
                       dropLocation={undefined}
                    />
                ) : (
                    <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /><p className="text-xs font-bold uppercase tracking-widest">Locating GPS...</p></div>
                )}
            </div>
        )}

        {!activeRide && (
        <div className="absolute top-6 left-4 right-4 z-50 flex justify-between items-center">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild><button className="bg-white/90 backdrop-blur-md h-12 w-12 rounded-full shadow-lg flex items-center justify-center"><Menu className="w-6 h-6" /></button></SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                    <div className="bg-slate-900 text-white p-6 pb-8"><div className="flex items-center gap-4"><Avatar className="h-16 w-16 border-2 border-emerald-400"><AvatarImage src={partnerData?.photoUrl} /><AvatarFallback>D</AvatarFallback></Avatar><div><h2 className="text-xl font-bold">{partnerData?.name}</h2><Badge className="bg-emerald-500 text-black">{partnerData?.rating || 5.0} ★</Badge></div></div></div>
                    <div className="p-4 space-y-1">
                        <MenuItem icon={User} label="Profile" subLabel="Account" onClick={() => { setActiveView('profile'); setMenuOpen(false); }} />
                        <MenuItem icon={Gift} label="Partner Ecosystem" subLabel="Services" onClick={() => { setActiveView('ecosystem'); setMenuOpen(false); }} />
                        <MenuItem icon={Wallet} label="Earnings" subLabel="Payouts" onClick={() => { setActiveView('earnings'); setMenuOpen(false); }} />
                        <MenuItem icon={FileText} label="Documents" subLabel="Licenses" onClick={() => { setActiveView('documents'); setMenuOpen(false); }} />
                        <Separator className="my-2" />
                        <Button className="w-full justify-start text-white bg-red-600 hover:bg-red-700 mb-2" onClick={forceResetDriver}><RefreshCw className="mr-2 h-4 w-4" /> Force Reset Driver</Button>
                        <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full shadow-xl flex items-center gap-3"><span className={`text-xs font-bold uppercase ${isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>{isOnline ? 'Online' : 'Offline'}</span><Switch checked={isOnline} onCheckedChange={toggleStatus} className="data-[state=checked]:bg-emerald-500" /></div>
        </div>
        )}

        <AnimatePresence>{isOnline && !activeRide && requests.length === 0 && (<OnlineScanner onStop={() => toggleStatus(false)} vehicleType={partnerData?.vehicleType || 'Any'} />)}</AnimatePresence>
        
        {isProcessing && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl flex flex-col items-center"><Loader2 className="animate-spin w-10 h-10 text-emerald-500 mb-2"/><p className="font-bold">Accepting Ride...</p></div></div>}

        <RidePopup 
            jobRequest={requests[0]} 
            driverLocation={currentLocation} 
            onAccept={() => handleAcceptRide(requests[0].id)} 
            onDecline={() => setRequests([])} 
        />
        
        {activeRide && (
            <div className="absolute inset-0 z-50 bg-white">
                <ActiveRideView activeRide={activeRide} />
            </div>
        )}
        
        <ShiftSummary open={showShiftSummary} onClose={() => setShowShiftSummary(false)} stats={{ earnings: "0", rides: 0, hours: "0.0" }} />
    </div>
  );
}

function MenuItem({ icon: Icon, label, subLabel, onClick }: any) { return (<Button variant="ghost" className="w-full h-auto py-3 justify-between group" onClick={onClick}><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors"><Icon className="w-5 h-5" /></div><div className="text-left"><p className="font-bold text-sm text-slate-900">{label}</p><p className="text-[10px] text-zinc-500 uppercase">{subLabel}</p></div></div><ChevronRight className="w-4 h-4 text-slate-300" /></Button>) }