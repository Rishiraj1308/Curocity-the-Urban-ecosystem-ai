'use client';

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Navigation, Search, AlertCircle, Loader2, X, RefreshCw, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { RideOptionsSheet } from "@/features/user/components/ride/RideOptionsSheet"; 
import DriverArriving from "@/features/user/components/ride/DriverArriving";

import { useFirebase } from "@/lib/firebase/client-provider";
import { useActiveRequest } from "@/features/user/components/active-request-provider";
import { addDoc, collection, serverTimestamp, GeoPoint } from "firebase/firestore";
import { useDebounce } from 'use-debounce';
import { getRoute, LatLng } from "@/lib/routing";
import { toast } from "sonner";
import { fetchFuzzySuggestions, reverseGeocode } from '@/lib/location-utils'; 
import { RideData } from "@/lib/types";

// ✅ LiveMap Import
const LiveMap = dynamic<any>(
  () => import("@/components/maps/LiveMap"), 
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" />,
  }
);

// --- Stats Helper ---
function calculateRideStats(coords: LatLng[]) {
    let distance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const [lat1, lon1] = coords[i];
        const [lat2, lon2] = coords[i + 1];
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance += R * c;
    }
    return { 
        distance: Number(distance.toFixed(1)),
        duration: Math.ceil((distance / 25) * 60)
    };
}

export default function BookRidePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, db } = useFirebase();
    const { activeRide, cancelRequest } = useActiveRequest();

    const [step, setStep] = useState<"input" | "select" | "searching" | "no_drivers">("input");
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [destination, setDestination] = useState("");
    const [debouncedDest] = useDebounce(destination, 600);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [routeData, setRouteData] = useState<any>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 🔥 1. SMART WATCHER (BILL FIX)
    useEffect(() => {
        // ❌ Bill Issue Fix: Hum sirf tab clear karenge jab payment "PAID" ho jaye.
        // Agar status "completed" hai par "paid" nahi hai, toh ride mat hatao (Bill dikhana hai).
        if (activeRide && (activeRide as any).paymentStatus === 'paid') {
             
             // Ride Data saaf karo
             cancelRequest("ride"); 
             
             // Wapis search page par bhejo
             if (step !== 'input') {
                 setStep("input");
             }
             return;
        }

        if (activeRide) {
            const isDriverAssigned = ["accepted", "arriving", "arrived", "in-progress", "in_progress", "completed", "payment_pending"].includes(activeRide.status);
            
            // Agar driver assign nahi hua aur searching hai, toh searching screen dikhao
            if (!isDriverAssigned && activeRide.status === 'searching') {
                if (step !== 'searching') setStep('searching');
            }
        } else {
            // Agar koi ride nahi hai, toh input screen par raho
            if (step === 'searching') setStep('input');
        }
    }, [activeRide, step, cancelRequest]);

    // 2. GPS Location
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setCurrentLocation(loc);
                
                // Deep Link Support (URL se data uthana)
                const dName = searchParams.get('dest');
                const dLat = searchParams.get('lat');
                const dLon = searchParams.get('lon');
                if (dName && dLat && dLon) {
                    setDestination(dName.split(',')[0]);
                    handleAutoSelect(loc, dLat, dLon);
                }
            },
            () => console.log("GPS Found"),
            { enableHighAccuracy: true }
        );
    }, [searchParams]);

    // 🔥 3. ADVANCED SEARCH INTEGRATION
    useEffect(() => {
        const getResults = async () => {
            // Agar query chhota hai ya ride select kar chuke ho, toh search mat karo
            if (debouncedDest.length < 3 || step === "select") { 
                setSearchResults([]); 
                return; 
            }

            setIsLoadingSearch(true);
            try {
                // ✅ Location Bias: Hum user ki lat/lon bhej rahe hain taaki paas ke Metro/Malls aayein
                const data = await fetchFuzzySuggestions(
                    debouncedDest, 
                    currentLocation?.lat, 
                    currentLocation?.lon
                );
                setSearchResults(data || []);
            } catch (err) {
                console.error(err);
                setSearchResults([]);
            } finally {
                setIsLoadingSearch(false);
            }
        };
        getResults();
    }, [debouncedDest, currentLocation, step]);

    const handleAutoSelect = async (loc: any, lat: string, lon: string) => {
        try {
            const coords = await getRoute([loc.lat, loc.lon], [Number(lat), Number(lon)]);
            const stats = calculateRideStats(coords);
            setRouteData({ coords, ...stats });
            setStep("select");
        } catch (e) { toast.error("Route failed"); }
    };

    const handleSelectPlace = async (place: any) => {
        if (!currentLocation) return toast.error("Waiting for GPS...");
        
        // Use clean short name
        const mainName = place.displayNameShort || place.display_name.split(',')[0];
        setDestination(mainName);
        setSearchResults([]);
        
        try {
            const coords = await getRoute([currentLocation.lat, currentLocation.lon], [Number(place.lat), Number(place.lon)]);
            const stats = calculateRideStats(coords);
            setRouteData({ coords, ...stats });
            setStep("select");
        } catch { toast.error("Route calculation failed"); }
    };

    const handleConfirmRide = async (rideType: string, _uiPrice: number) => {
        if (!db || !user || !routeData) return;
        setStep("searching");
        toast.info("Connecting to nearby captains...");

        const basePrice = 40;
        const ratePerKm = 12; 
        const exactFare = Math.round(basePrice + (routeData.distance * ratePerKm));

        let pickupAddress = "Current Location";
        if (currentLocation) {
            pickupAddress = await reverseGeocode(currentLocation.lat, currentLocation.lon);
        }

        try {
            await addDoc(collection(db, "rides"), {
                userId: user.uid,
                riderId: user.uid,
                riderName: user.displayName || "User",
                riderPhotoUrl: user.photoURL || null,
                riderPhone: user.phoneNumber || "",
                pickup: { 
                    location: new GeoPoint(currentLocation.lat, currentLocation.lon), 
                    address: pickupAddress 
                },
                destination: { 
                    location: new GeoPoint(routeData.coords.at(-1)[0], routeData.coords.at(-1)[1]), 
                    address: destination 
                },
                rideType: rideType.toLowerCase(),
                status: "searching", 
                fare: exactFare,
                distance: routeData.distance,
                createdAt: serverTimestamp(),
                otp: Math.floor(1000 + Math.random() * 9000).toString()
            });
            searchTimeoutRef.current = setTimeout(() => setStep("no_drivers"), 90000);
        } catch (e) { 
            console.error(e);
            toast.error("Booking failed. Please try again."); 
            setStep("select"); 
        }
    };

    const handleReset = async () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (activeRide) await cancelRequest("ride");
        setStep("input");
        setRouteData(null);
        setDestination("");
        setSearchResults([]);
        if (step === 'searching') window.location.reload();
    };

    // ✅ GATEKEEPER: Driver tabhi dikhao jab ride chal rahi ho aur Payment PENDING ho.
    // Agar payment 'paid' hai, toh ye false ho jayega aur input screen dikhegi.
    const showDriver = activeRide && 
        ["accepted", "arriving", "arrived", "in-progress", "in_progress", "completed", "payment_pending"].includes(activeRide.status) &&
        (activeRide as any).paymentStatus !== 'paid'; 

    const isSearching = step === "searching" || (activeRide?.status === 'searching');

    return (
        <div className="h-[100dvh] w-full relative overflow-hidden bg-slate-50">
            
            {/* Map Background */}
            {!showDriver && (
                <div className="absolute inset-0 z-0">
                    <LiveMap 
                        pickupLocation={currentLocation ? [currentLocation.lat, currentLocation.lon] : null}
                        routeCoordinates={routeData?.coords || null}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5 pointer-events-none" />
                </div>
            )}
            
            {/* Header Controls */}
            {!showDriver && !isSearching && (
                <div className="absolute top-6 left-4 right-4 z-[70] flex items-center justify-between pointer-events-none">
                    <Button size="icon" className="pointer-events-auto rounded-full bg-white/90 backdrop-blur-md shadow-lg text-slate-900 w-12 h-12 hover:bg-white" onClick={() => step === "select" ? handleReset() : router.push("/user")}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Button size="sm" variant="destructive" className="pointer-events-auto rounded-full shadow-lg text-xs font-bold px-4" onClick={handleReset}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Reset
                    </Button>
                </div>
            )}

            {/* Search Input Panel */}
            <AnimatePresence>
                {step === "input" && !showDriver && !isSearching && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-8 left-0 right-0 px-4 z-[100] max-w-lg mx-auto">
                        <div className="bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] p-4 border border-white/50">
                            <div className="flex items-center gap-4 px-4 h-14 bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                <Navigation className="w-5 h-5 text-blue-600 shrink-0" />
                                <Input className="border-none focus-visible:ring-0 text-lg font-semibold p-0 h-full bg-transparent placeholder:text-slate-400 text-slate-900" placeholder="Where to next?" value={destination} onChange={(e) => setDestination(e.target.value)} autoFocus />
                                {isLoadingSearch && <Loader2 className="animate-spin text-blue-600 w-5 h-5" />}
                                {destination && !isLoadingSearch && <button onClick={() => setDestination("")} className="text-slate-400 p-2 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>}
                            </div>
                            
                            {/* Search Results List */}
                            {searchResults.length > 0 && (
                                <div className="max-h-[40vh] overflow-y-auto no-scrollbar mt-3 divide-y divide-slate-50 px-1">
                                    {searchResults.map((p, i) => (
                                        <div key={i} onClick={() => handleSelectPlace(p)} className="flex items-center gap-4 py-3 px-2 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{p.displayNameShort}</p>
                                                    {p.distance && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{p.distance}</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-400 line-clamp-1">{p.display_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <RideOptionsSheet open={step === "select"} onClose={handleReset} onSelect={handleConfirmRide} destinationName={destination} distance={routeData?.distance} duration={routeData?.duration} />

            {/* Searching Radar Animation */}
            <AnimatePresence>
                {isSearching && !showDriver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                        <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
                            <div className="absolute inset-4 bg-blue-500/20 rounded-full animate-ping delay-150" />
                            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/30">
                                <Search className="text-white w-10 h-10 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-slate-900 text-3xl font-black italic tracking-tighter">CONNECTING...</h3>
                        <p className="text-slate-500 mt-2 font-medium">Finding the best Captain for you</p>
                        <Button variant="ghost" className="mt-16 text-red-500 font-bold hover:bg-red-50 rounded-full px-8" onClick={handleReset}>Cancel Request</Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No Drivers Found */}
            <AnimatePresence>
                {step === "no_drivers" && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-[130] bg-white p-10 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">NO CAPTAINS NEARBY</h3>
                        <p className="text-slate-500 mb-8">All our captains are currently busy. Please try again in a few minutes.</p>
                        <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-900/20" onClick={() => setStep("select")}>Retry Search</Button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Driver View (Shows Bill if status is completed) */}
            {showDriver && (
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="z-[200] absolute bottom-0 top-0 left-0 right-0 bg-white">
                    <DriverArriving ride={activeRide as RideData} onCancel={() => cancelRequest("ride")} />
                </motion.div>
            )}
        </div>
    );
}