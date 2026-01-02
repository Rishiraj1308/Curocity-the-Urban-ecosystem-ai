import { doc, updateDoc } from "firebase/firestore";

export async function cancelRide(db: any, rideId: string) {
  try {
    await updateDoc(doc(db, "rides", rideId), {
      status: "cancelled_by_rider",
      cancelledAt: new Date(),
    });

    console.log("Ride cancelled:", rideId);
    return true;
  } catch (error) {
    console.error("Cancel ride error:", error);
    return false;
  }
}
