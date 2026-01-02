import { 
    getFirestore, 
    doc, 
    runTransaction, 
    serverTimestamp, 
    GeoPoint 
} from "firebase/firestore";
import { toast } from "sonner";

// Initialize DB
const db = getFirestore(); 

// 🟢 LOGIC 1: ACCEPT RIDE
export const acceptRideTransaction = async (rideId: string, driverData: any, currentLocation: any) => {
    // Basic Validation
    if (!rideId || !driverData?.id || !currentLocation) {
        toast.error("Missing ride or driver information");
        return false;
    }

    const rideRef = doc(db, "rides", rideId);
    const driverRef = doc(db, "pathPartners", driverData.id);

    try {
        await runTransaction(db, async (transaction) => {
            // 🔥 STEP 1: READS (Must come first!)
            const rideDoc = await transaction.get(rideRef);
            const driverDoc = await transaction.get(driverRef);

            // Checks
            if (!rideDoc.exists()) throw "Ride does not exist!";
            if (!driverDoc.exists()) throw "Driver profile not found!";

            const rideData = rideDoc.data();
            const driverSnapshot = driverDoc.data();

            if (rideData.status !== "searching") {
                throw "Ride already taken or cancelled.";
            }

            if (driverSnapshot.liveStatus === 'on_trip' || driverSnapshot.currentRideId) {
                throw "You are already on another ride!";
            }

            // 🔥 STEP 2: WRITES (Must come last!)
            
            // Update Ride
            transaction.update(rideRef, {
                status: "accepted",
                driverId: driverData.id,
                driverName: driverData.name,
                driverPhone: driverData.phone || "",
                driverPhoto: driverData.photoUrl || "",
                driverVehicleNumber: driverData.vehicleNumber || "",
                driverVehicleModel: driverData.vehicleModel || "",
                driverLocation: new GeoPoint(currentLocation.latitude, currentLocation.longitude),
                acceptedAt: serverTimestamp(),
                pendingDriverIds: [] 
            });

            // Update Driver
            transaction.update(driverRef, {
                currentRideId: rideId,
                liveStatus: "on_trip", 
                isOnline: true, 
                lastActiveLocation: new GeoPoint(currentLocation.latitude, currentLocation.longitude)
            });
        });

        toast.success("Ride Accepted! Navigation Starting...");
        return true;

    } catch (error: any) {
        console.error("Accept Transaction Error:", error);
        toast.error(typeof error === "string" ? error : "Failed to accept ride.");
        return false;
    }
};

// 🟢 LOGIC 2: COMPLETE RIDE
export const completeRideTransaction = async (rideId: string, driverId: string, finalFare: number) => {
    if (!rideId || !driverId) return false;

    const rideRef = doc(db, "rides", rideId);
    const driverRef = doc(db, "pathPartners", driverId);

    try {
        await runTransaction(db, async (transaction) => {
            // 🔥 STEP 1: READS (Moved to the top to fix error)
            const rideDoc = await transaction.get(rideRef);
            const driverSnapshot = await transaction.get(driverRef);

            if (!rideDoc.exists()) throw "Ride not found";
            if (!driverSnapshot.exists()) throw "Driver not found";

            // Logic using read data
            const driverData = driverSnapshot.data();
            const currentEarnings = driverData?.totalEarnings || 0;
            const currentRides = driverData?.totalRides || 0;

            // 🔥 STEP 2: WRITES (Done after all reads)
            
            // Mark Ride as Completed
            transaction.update(rideRef, {
                status: "completed",
                paymentStatus: "paid",
                completedAt: serverTimestamp(),
                finalFare: finalFare
            });

            // Update Driver Stats & Free them
            transaction.update(driverRef, {
                currentRideId: null, 
                liveStatus: "online", 
                totalEarnings: currentEarnings + finalFare,
                totalRides: currentRides + 1
            });
        });

        return true;
    } catch (error) {
        console.error("Completion Error:", error);
        toast.error("Could not complete ride. Try again.");
        return false;
    }
};

// 🟢 LOGIC 3: CANCEL RIDE
export const cancelRideByDriver = async (rideId: string, driverId: string, reason: string) => {
    if (!rideId || !driverId) return false;

    const rideRef = doc(db, "rides", rideId);
    const driverRef = doc(db, "pathPartners", driverId);

    try {
        await runTransaction(db, async (transaction) => {
            // Only Writes here, so order doesn't matter as much, but kept clean
            transaction.update(rideRef, {
                status: "cancelled_by_driver",
                cancellationReason: reason,
                cancelledAt: serverTimestamp()
            });

            transaction.update(driverRef, {
                currentRideId: null,
                liveStatus: "online"
            });
        });
        return true;
    } catch (e) {
        console.error(e);
        toast.error("Cancellation failed");
        return false;
    }
};  