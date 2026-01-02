// src/features/driver/hooks/useIncomingRequests.ts
'use client';

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useDriver } from '@/context/DriverContext';
import { useFirebase } from '@/lib/firebase/client-provider';

export function useIncomingRequests() {
    const { db } = useFirebase();
    const { partnerData } = useDriver();
    const [incomingRide, setIncomingRide] = useState<any>(null);

    useEffect(() => {
        // 🔥 DEBUG LOG: Check if driver is ready
        if (!db || !partnerData?.id || !partnerData?.isOnline) {
            console.log("📡 Driver Listener: Waiting for Online status...");
            setIncomingRide(null);
            return;
        }

        const myVehicle = partnerData.vehicleType?.toLowerCase().trim() || 'any';
        const ridesRef = collection(db, "rides");
        
        // Status 'searching' wali rides dhoondo
        const q = query(ridesRef, where("status", "==", "searching"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRides: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 🔥 Vehicle Matching Logic
            const matchedRides = allRides.filter((ride) => {
                const rideType = ride.rideType?.toLowerCase().trim();
                
                // Broad Matching: Car aur Cab ko ek hi maano
                const isCarMatch = (myVehicle === 'car' || myVehicle === 'cab') && 
                                  (rideType === 'car' || rideType === 'cab');

                if (isCarMatch) return true;
                if (myVehicle === 'any' || !rideType) return true;
                return rideType === myVehicle;
            });

            if (matchedRides.length > 0) {
                // Latest ride sabse pehle dikhao
                const sorted = matchedRides.sort((a: any, b: any) => 
                    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                );
                setIncomingRide(sorted[0]);
            } else {
                setIncomingRide(null);
            }
        });

        return () => unsubscribe();
    }, [db, partnerData?.id, partnerData?.isOnline, partnerData?.vehicleType]);

    return { incomingRide };
}