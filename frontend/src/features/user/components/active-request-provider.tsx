"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { useFirebase } from "@/lib/firebase/client-provider";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

import type { RideData, GarageRequest, AmbulanceCase } from "@/lib/types";
import { toast } from "sonner";

interface ActiveRequestContextType {
  activeRide: RideData | null;
  activeGarageRequest: GarageRequest | null;
  activeAmbulanceCase: AmbulanceCase | null;
  isLoading: boolean;
  cancelRequest: (type: "ride" | "garage" | "ambulance") => Promise<void>;
}

const ActiveRequestContext = createContext<ActiveRequestContextType>({
  activeRide: null,
  activeGarageRequest: null,
  activeAmbulanceCase: null,
  isLoading: true,
  cancelRequest: async () => {},
});

export const useActiveRequest = () => useContext(ActiveRequestContext);

// 🟢 ACTIVE STATES (UI stays visible)
// Added 'completed' here so the Bill UI works on refresh
const ACTIVE_STATES = new Set([
  "searching",
  "no_drivers_available",
  "accepted",
  "arriving",
  "arrived",
  "in-progress",
  "in_progress",
  "payment_pending",
  "bill_sent",
  "driver_assigned",
  "completed", // <--- CRITICAL FIX
]);

// 🔴 TERMINAL STATES (UI resets completely)
const TERMINAL_STATES = new Set([
  "cancelled_by_rider",
  "cancelled_by_driver",
  "cancelled_by_user",
  // 'completed' removed from here
]);

export const ActiveRequestProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, db, isUserLoading } = useFirebase();

  const [activeRide, setActiveRide] = useState<RideData | null>(null);
  const [activeGarageRequest, setActiveGarageRequest] =
    useState<GarageRequest | null>(null);
  const [activeAmbulanceCase, setActiveAmbulanceCase] =
    useState<AmbulanceCase | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const reset = useCallback(() => {
    setActiveRide(null);
    setActiveGarageRequest(null);
    setActiveAmbulanceCase(null);
  }, []);

  const cancelRequest = useCallback(
    async (type: "ride" | "garage" | "ambulance") => {
      if (!db) return;

      let ref = null;
      let status = "";

      if (type === "ride" && activeRide) {
        ref = doc(db, "rides", activeRide.id);
        status = "cancelled_by_rider";
      }

      if (type === "garage" && activeGarageRequest) {
        ref = doc(db, "garageRequests", activeGarageRequest.id);
        status = "cancelled_by_user";
      }

      if (type === "ambulance" && activeAmbulanceCase) {
        ref = doc(db, "emergencyCases", activeAmbulanceCase.id);
        status = "cancelled_by_user";
      }

      if (!ref) return;

      try {
        await updateDoc(ref, { status });
        reset();
        toast.info("Request cancelled successfully");
      } catch (error) {
        console.error("Cancel Error:", error);
        toast.error("Failed to cancel request");
      }
    },
    [db, activeRide, activeGarageRequest, activeAmbulanceCase, reset]
  );

  // 🔥 MAIN LISTENER LOGIC
  const attachListener = (
    collectionName: "rides" | "garageRequests" | "emergencyCases",
    setter: (data: any | null) => void
  ) => {
    // Logic for field naming differences
    let riderField = "riderId";
    if (collectionName === "garageRequests") riderField = "userId";
    
    // NOTE: Ensure Firestore Composite Index exists for: riderId ASC + createdAt DESC
    const q = query(
      collection(db, collectionName),
      where(riderField, "==", user!.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setter(null);
        return;
      }

      const d = snapshot.docs[0];
      const data = { id: d.id, ...d.data() } as any;

      // Check active vs terminal status
      if (ACTIVE_STATES.has(data.status)) {
        setter(data);
      } else if (TERMINAL_STATES.has(data.status)) {
        setter(null);
      }
    }, (error) => {
        console.error(`Listener Error (${collectionName}):`, error);
    });
  };

  useEffect(() => {
    if (!db || !user || isUserLoading) return;

    const unsubRide = attachListener("rides", setActiveRide);
    const unsubGarage = attachListener("garageRequests", setActiveGarageRequest);
    const unsubAmb = attachListener("emergencyCases", setActiveAmbulanceCase);

    setIsLoading(false);

    return () => {
      unsubRide();
      unsubGarage();
      unsubAmb();
    };
  }, [db, user, isUserLoading]);

  return (
    <ActiveRequestContext.Provider
      value={{
        activeRide,
        activeGarageRequest,
        activeAmbulanceCase,
        cancelRequest,
        isLoading,
      }}
    >
      {children}
    </ActiveRequestContext.Provider>
  );
};