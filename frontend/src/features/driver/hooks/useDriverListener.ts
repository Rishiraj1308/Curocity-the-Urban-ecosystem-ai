
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase/client-provider';
import { useDriver } from '@/context/DriverContext';
import type { RideData } from '@/lib/types';
import { toast } from 'sonner';

export function useDriverListener() {
  const { db } = useFirebase();
  const { partnerData } = useDriver();

  // 🔥 FIX: The document ID is the correct identifier for the driver
  const driverId = partnerData?.id; 

  const [jobRequest, setJobRequest] = useState<RideData | null>(null);
  const [activeRide, setActiveRide] = useState<RideData | null>(null);

  // 1. Listen for new ride requests for THIS driver
  useEffect(() => {
    if (!db || !driverId || !partnerData?.isOnline) return;
    if (jobRequest || activeRide) return;

    const q = query(
      collection(db, 'rides'),
      where('status', '==', 'searching'),
      where('pendingDriverIds', 'array-contains', driverId) // Check if this driver is in the pending list
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as RideData;
        // Avoid race conditions
        if (!jobRequest) {
          setJobRequest({ id: docSnap.id, ...data });
        }
      } else {
        setJobRequest(null);
      }
    });

    return () => unsub();
  }, [db, driverId, partnerData?.isOnline, jobRequest, activeRide]);


  // 2. Listen for active ride updates
  useEffect(() => {
    if (!db) return;

    // Use a persistent way to track the active ride
    const activeRideId = localStorage.getItem('activeRideId');
    if (!activeRideId) {
      if (activeRide) setActiveRide(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'rides', activeRideId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RideData;

        // Reset if ride is completed or cancelled
        if (['completed', 'cancelled_by_rider', 'cancelled_by_driver'].includes(data.status)) {
          toast.info(data.status === 'completed' ? 'Ride Completed' : 'Ride Cancelled');
          localStorage.removeItem('activeRideId');
          setActiveRide(null);
        } else {
          setActiveRide({ id: docSnap.id, ...data });
        }

      } else {
        localStorage.removeItem('activeRideId');
        setActiveRide(null);
      }
    });

    return () => unsub();
  }, [db]); // Re-run only if db instance changes


  // 3. Accept Job
  const acceptJob = useCallback(async () => {
    if (!jobRequest || !db || !partnerData) return;

    const rideRef = doc(db, 'rides', jobRequest.id);
    const partnerRef = doc(db, 'pathPartners', partnerData.id); // Use the correct document ID

    try {
      await updateDoc(rideRef, {
        status: 'accepted',
        driverId: partnerData.id, // 🔥 FIX: Use the actual Document ID
        driverDetails: {
          name: partnerData.name,
          vehicle: `${partnerData.vehicleBrand} ${partnerData.vehicleName}`,
          vehicleNumber: partnerData.vehicleNumber,
          rating: partnerData.rating || 5.0,
          phone: partnerData.phone,
          photoUrl: partnerData.photoUrl,
        },
      });

      await updateDoc(partnerRef, { liveStatus: 'on_trip' });

      localStorage.setItem('activeRideId', jobRequest.id);
      setActiveRide({ ...jobRequest, status: 'accepted' });
      setJobRequest(null);
      toast.success('Ride Accepted!');
    } catch (error) {
      console.error("Accept Error:", error);
      toast.error("Failed to accept ride.");
      setJobRequest(null);
    }
  }, [jobRequest, db, partnerData]);


  // 4. Decline Job
  const declineJob = useCallback(async (isTimeout = false) => {
    if (!jobRequest || !db || !driverId) return;

    try {
      const rideRef = doc(db, 'rides', jobRequest.id);
      await updateDoc(rideRef, {
        rejectedBy: arrayUnion(driverId) // 🔥 FIX: Use the correct document ID
      });

      if (!isTimeout) toast.info("Ride Declined");
    } catch (error) {
      console.error("Error declining ride:", error);
    } finally {
      setJobRequest(null);
    }
  }, [jobRequest, db, driverId]);


  return {
    jobRequest,
    activeRide,
    acceptJob,
    declineJob,
  };
}
