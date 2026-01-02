import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  GeoPoint
} from 'firebase/firestore';
import type { RideData } from '@/lib/types'; // Ensure types.ts is updated

// Helper: Distance Calculation
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔥 UPDATED DISPATCH FUNCTION
export async function dispatchRideLocally(db: any, rideId: string) {
  try {
    const rideRef = doc(db, 'rides', rideId);
    const snap = await getDoc(rideRef);
    if (!snap.exists()) return;

    const ride = snap.data() as RideData;
    // Sirf tab dhoondo agar ride 'searching' mein ho
    if (ride.status !== 'searching') return;

    const pickup = ride.pickup?.location;
    if (!pickup) return;

    // 1. Get Online Drivers
    const partnersRef = collection(db, 'pathPartners');
    // Hum check kar rahe hain ki Driver ONLINE hai
    const q = query(partnersRef, where('isOnline', '==', true));

    const qsnap = await getDocs(q);
    const neededType = (ride.rideType || '').toLowerCase();
    const potentialDrivers: string[] = [];

    qsnap.forEach((docSnap) => {
      const driver = docSnap.data();
      
      // 🛑 CHECK 1: Kya driver already trip pe hai? (Connected with RideController logic)
      if (driver.liveStatus === 'on_trip' || driver.currentRideId) return;

      // 🛑 CHECK 2: Vehicle Type Match
      const driverVehicle = (driver.vehicleType || '').toLowerCase();
      if (neededType && !driverVehicle.includes(neededType)) return;

      // 🛑 CHECK 3: Location & Distance (5KM Radius)
      if (driver.currentLocation) {
        const d = distance(
          pickup.latitude,
          pickup.longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );

        if (d < 5) { // 5 KM
             potentialDrivers.push(docSnap.id);
        }
      }
    });

    if (potentialDrivers.length === 0) {
      console.log("⚠️ No drivers found nearby");
      // Optional: Update status to 'no_drivers_available' or keep searching
      return;
    }

    // ✅ UPDATE RIDE: Add drivers to 'pendingDriverIds'
    // Yeh list 'useIncomingRequests.ts' padhega aur driver ko popup dikhayega
    await updateDoc(rideRef, {
      pendingDriverIds: potentialDrivers,
      updatedAt: serverTimestamp()
    });

    console.log(`🚕 Dispatched to ${potentialDrivers.length} drivers:`, potentialDrivers);

  } catch (err) {
    console.error("dispatchRideLocally error:", err);
  }
}