
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Car, HeartHandshake } from 'lucide-react';
import { getRoute, searchPlace } from '@/lib/routing';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useFirebase } from '@/lib/firebase/client-provider';
import { GeoPoint, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SearchingIndicator from '@/components/ui/searching-indicator';

const LiveMap = dynamic(() => import('@/features/user/components/ride/LiveMap'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full bg-muted" />,
});

const fareConfig: Record<string, { base: number, perKm: number, serviceFee: number }> = {
    'Bike': { base: 20, perKm: 5, serviceFee: 0 },
    'Auto': { base: 30, perKm: 8, serviceFee: 0 },
    'Cab (Lite)': { base: 40, perKm: 12, serviceFee: 20 },
    'Curocity Pink': { base: 50, perKm: 12, serviceFee: 30 },
};

const rideTypesTemplate = [
    { name: 'Bike', desc: 'Quick and affordable', icon: Car },
    { name: 'Auto', desc: 'Best for city travel', icon: Car },
    { name: 'Cab (Lite)', desc: 'Comfortable & safe', icon: Car },
    { name: 'Curocity Pink', desc: 'Women-Safe Ride', icon: HeartHandshake },
];

export default function BookRideMapPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-screen" />}>
            <BookRideMapComponent />
        </Suspense>
    );
}

function BookRideMapComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { db, user } = useFirebase();

    const [pickup, setPickup] = useState<any>(null);
    const [destination, setDestination] = useState<any>(null);
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [rideTypes, setRideTypes] = useState<any[]>([]);
    const [selectedRide, setSelectedRide] = useState('Cab (Lite)');
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => setIsClient(true), []);

    const getAddress = async (lat: number, lon: number) => {
        try {
            const res = await fetch(`/api/search?lat=${lat}&lon=${lon}`);
            const data = await res.json();
            return data?.display_name || 'Current Location';
        } catch {
            return 'Current Location';
        }
    };

    useEffect(() => {
        const destQuery = searchParams.get('search');
        if (!destQuery) return router.back();

        navigator.geolocation.getCurrentPosition(async loc => {
            const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
            setPickup({ address: await getAddress(coords.lat, coords.lon), coords });
        });

        searchPlace(destQuery).then(res => {
            if (res.length > 0) {
                setDestination({
                    address: res[0].display_name,
                    coords: { lat: +res[0].lat, lon: +res[0].lon },
                });
            }
        });
    }, [router, searchParams]);

    useEffect(() => {
        if (!pickup?.coords || !destination?.coords) return;

        (async () => {
            setIsLoading(true);
            const route = await getRoute(pickup.coords, destination.coords);
            const data = route.routes[0];
            const distanceKm = data.distance / 1000;
            const durationMin = Math.round(data.duration / 60);

            setRouteGeometry(data.geometry);
            setRouteInfo({ distance: distanceKm, duration: durationMin });

            setRideTypes(
                rideTypesTemplate.map(x => {
                    const config = fareConfig[x.name];
                    if (!config) return null; // handle cases where config might not exist
                    const total = Math.round(((config.base + config.perKm * distanceKm) * 1.2) / 5) * 5;
                    return { ...x, fare: `₹${total}`, eta: `${durationMin + 3} min`, total };
                }).filter(Boolean) // remove nulls
            );

            setIsLoading(false);
        })();
    }, [pickup, destination]);

    const handleConfirmRide = async () => {
        if (!db || !user || !pickup?.coords || !destination?.coords || !routeInfo) {
            toast.error("Cannot book ride", { description: "Missing user, location, or route information." });
            return;
        }

        setIsBooking(true);

        try {
            const selectedRideInfo = rideTypes.find(rt => rt.name === selectedRide);
            if (!selectedRideInfo) {
                throw new Error("Invalid ride type selected");
            }
            
            const fare = selectedRideInfo.total;
            const otp = Math.floor(1000 + Math.random() * 9000).toString();

            const payload = {
                riderId: user.uid,
                riderName: user.displayName || "User",
                riderPhone: user.phoneNumber || "Unknown",
                riderGender: (user as any).gender || 'unknown',
                rideType: selectedRide,
                otp,
                status: "searching",
                pickup: {
                    address: pickup.address,
                    location: new GeoPoint(pickup.coords.lat, pickup.coords.lon),
                },
                destination: {
                    address: destination.address,
                    location: new GeoPoint(destination.coords.lat, destination.coords.lon),
                },
                distance: routeInfo.distance,
                duration: routeInfo.duration,
                fare,
                createdAt: serverTimestamp(),
                rejectedBy: [],
            };

            await addDoc(collection(db, "rides"), payload);
            toast.success("Ride requested!", { description: "Searching for a nearby driver..." });
            router.replace("/user/ride-status");

        } catch (err: any) {
            console.error("Ride creation failed:", err);
            toast.error("Ride request failed", { description: err.message || "An unknown error occurred." });
            setIsBooking(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            <Button variant="outline" size="icon" className="absolute top-4 left-4 z-50" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>

            <div className="flex-1 relative">
                {isClient && <LiveMap riderLocation={pickup?.coords} destinationLocation={destination?.coords} routeGeometry={routeGeometry} />}
            </div>

            <Card className="rounded-t-3xl shadow-2xl p-4 border-t-4 border-primary/20 h-[60%] flex flex-col">
                {isBooking ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <SearchingIndicator partnerType="ride" />
                        <p className="mt-4 font-semibold text-lg">Finding a driver...</p>
                    </div>
                ) : (
                    <>
                        <CardHeader className="text-center pt-2">
                            <CardTitle>Ride to {destination?.address?.split(',')[0]}</CardTitle>
                            <CardDescription>
                                {routeInfo ? `${routeInfo.duration} min • ${routeInfo.distance.toFixed(1)} km` : 'Calculating...'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-2 overflow-y-auto flex-1">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                            ) : rideTypes.map(rt => (
                                <Card
                                    key={rt.name}
                                    onClick={() => setSelectedRide(rt.name)}
                                    className={cn(
                                        'flex items-center p-3 cursor-pointer transition border',
                                        rt.name === selectedRide && 'ring-2 ring-primary'
                                    )}
                                >
                                    <rt.icon className="w-10 h-10 text-primary" />
                                    <div className="ml-3 flex-1">
                                        <p className="font-bold">{rt.name}</p>
                                        <p className="text-xs text-muted-foreground">{rt.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{rt.fare}</p>
                                        <p className="text-xs flex items-center justify-end gap-1">
                                            <Clock className="w-3 h-3" /> {rt.eta}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </CardContent>

                        <CardFooter>
                            <Button className="w-full h-12" disabled={isLoading} onClick={handleConfirmRide}>
                                {isLoading ? 'Loading...' : 'Confirm Ride'}
                            </Button>
                          </CardFooter>
                    </>
                )}
            </Card>
        </div>
    );
}

    