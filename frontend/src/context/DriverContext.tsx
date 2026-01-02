'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, onSnapshot, collection, query, where, GeoPoint } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { startOfDay, endOfDay } from 'date-fns';

// --- TYPES ---
export interface PartnerData {
  id: string;
  name?: string;
  phone?: string;
  status?: string; 
  isOnline?: boolean;
  currentLocation?: GeoPoint;
  vehicleNumber?: string;
  partnerId?: string;
  photoUrl?: string;
  rating?: number;
  [key: string]: any;
}

export interface RideStats {
    jobsToday: number;
    earningsToday: number;
    acceptanceRate: number;
    rating: number;
}

export interface RideData {
    id: string;
    fare?: number;
    status?: string;
    createdAt?: any;
    [key: string]: any;
}

interface DriverContextType {
  partnerData: PartnerData | null;
  rideStats: RideStats;
  recentRides: RideData[];
  isLoading: boolean;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

export const DriverProvider = ({ children }: { children: ReactNode }) => {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [rideStats, setRideStats] = useState<RideStats>({ jobsToday: 0, earningsToday: 0, acceptanceRate: 100, rating: 5.0 });
  const [recentRides, setRecentRides] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { db, auth, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return;
    const isOnboardingPage = pathname.includes('/driver/onboarding') || pathname.includes('/path/onboarding');
    
    const unsubscribe = auth?.onAuthStateChanged((user) => {
      if (user) {
        // 🔥 CRITICAL FIX: Hamesha UID se document dhoondo (No LocalStorage)
        const partnerDocRef = doc(db, 'pathPartners', user.uid);

        const unsubPartner = onSnapshot(partnerDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as PartnerData;
            setPartnerData(data);
            setRideStats(prev => ({ ...prev, rating: data.rating || 5.0 }));
            setIsLoading(false);
          } else {
            // Profile missing
            setIsLoading(false);
          }
        }, () => setIsLoading(false));

        // Stats Listener
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const ridesQuery = query(
            collection(db, 'rides'),
            where('driverId', '==', user.uid),
            where('createdAt', '>=', todayStart),
            where('createdAt', '<=', todayEnd)
        );

        const unsubRides = onSnapshot(ridesQuery, (snapshot) => {
            const todaysRides = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RideData));
            const completedRides = todaysRides.filter(r => r.status === 'completed');
            const earnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
            
            setRideStats(prev => ({
                ...prev,
                jobsToday: completedRides.length,
                earningsToday: earnings
            }));
            setRecentRides(todaysRides.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        });

        return () => { unsubPartner(); unsubRides(); };

      } else {
        setPartnerData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [auth, db, isUserLoading, pathname]);

  const value = { partnerData, rideStats, recentRides, isLoading };

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => {
  const context = useContext(DriverContext);
  if (context === undefined) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
};