import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc, 
    serverTimestamp 
} from "firebase/firestore";
import ngeohash from "ngeohash";

const db = getFirestore();

// Helper: Haversine Distance Formula (KM mein)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

// 🚀 MAIN FUNCTION
export const dispatchRideRequest = async (rideId: string, pickupLat: number, pickupLon: number, vehicleType: string = "") => {
    try {
        console.log("🔍 Searching for drivers near:", pickupLat, pickupLon);

        // 1. Get Online Drivers
        const driversRef = collection(db, "pathPartners");
        const q = query(
            driversRef, 
            where("isOnline", "==", true)
            // Note: Real scaling ke liye yahan geohash range query lagti hai
        );

        const snapshot = await getDocs(q);
        const nearbyDrivers: string[] = [];

        // 2. Filter Logic (Radius + Status + Vehicle)
        snapshot.forEach((doc) => {
            const driver = doc.data();
            
            // Filter: Busy Drivers
            if (driver.liveStatus === 'on_trip' || driver.currentRideId) return;

            // Filter: Vehicle Type (Optional)
            if (vehicleType && driver.vehicleType && !driver.vehicleType.toLowerCase().includes(vehicleType.toLowerCase())) return;

            // Filter: Distance (5 KM Radius)
            if (driver.currentLocation) {
                const dist = getDistanceFromLatLonInKm(
                    pickupLat, 
                    pickupLon, 
                    driver.currentLocation.latitude, 
                    driver.currentLocation.longitude
                );

                if (dist <= 5) { 
                    nearbyDrivers.push(doc.id);
                }
            }
        });

        if (nearbyDrivers.length === 0) {
            console.log("⚠️ No drivers found nearby");
            return { success: false, message: "No captains available nearby." };
        }

        console.log(`✅ Found ${nearbyDrivers.length} captains. Dispatching...`);

        // 3. Update Ride Doc (Isse Drivers ko notification milega)
        const rideRef = doc(db, "rides", rideId);
        await updateDoc(rideRef, {
            status: "searching",
            pendingDriverIds: nearbyDrivers,
            updatedAt: serverTimestamp()
        });

        return { success: true, count: nearbyDrivers.length };

    } catch (error) {
        console.error("🔥 Dispatch Error:", error);
        return { success: false, error };
    }
};