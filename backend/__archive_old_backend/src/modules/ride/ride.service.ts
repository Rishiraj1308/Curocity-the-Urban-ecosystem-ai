import { getFirestore, GeoPoint, FieldValue } from 'firebase-admin/firestore';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { Partner } from './ride.model';

const db = getFirestore();

export const dispatchRide = async (rideData: any, rideId: string) => {
    // ❗ FIXED: Admin SDK correct syntax
    const rideRef = db.collection('rides').doc(rideId);

    // 1. Check ride validity
    const rideDoc = await rideRef.get();
    if (!rideDoc.exists || rideDoc.data()?.status !== 'searching') {
        console.log(`[Dispatch] Ride ${rideId} is no longer valid for dispatch.`);
        return;
    }

    // 2. Pickup location
    const rideLoc = rideData.pickup?.location as GeoPoint;
    if (!rideLoc) {
        console.warn(`[Dispatch] Ride ${rideId} has no pickup location.`);
        return;
    }

    // 3. Geo query setup
    const center = [rideLoc.latitude, rideLoc.longitude] as [number, number];
    const radiusInM = 8000; // 8 km
    const bounds = geohashQueryBounds(center, radiusInM);

    const queries = bounds.map((b) =>
        db.collection("pathPartners")
            .where("isOnline", "==", true)
            .where("liveStatus", "==", "online")
            .orderBy("geohash")
            .startAt(b[0])
            .endAt(b[1])
            .get()
    );

    const snapshots = await Promise.all(queries);

    const matchingPartners: Partner[] = [];
    const rejectedBy = rideData.rejectedBy || [];
    const rideBaseType = (rideData.rideType || "").split(" ")[0].trim().toLowerCase();

    // 4. Filter drivers
    for (const snap of snapshots) {
        for (const docSnap of snap.docs) {
            const partnerData = docSnap.data() as Partner;

            const lat = partnerData.currentLocation?.latitude;
            const lng = partnerData.currentLocation?.longitude;

            if (!lat || !lng) continue;
            if (rejectedBy.includes(docSnap.id)) continue;

            // Vehicle type match
            const partnerVehicleBaseType = (partnerData.vehicleType || "").split(" ")[0].trim().toLowerCase();
            if (rideBaseType && partnerVehicleBaseType !== rideBaseType) continue;

            // Pink mode filter
            if (
                rideData.rideType === "Curocity Pink" &&
                (!partnerData.isCurocityPinkPartner || partnerData.gender !== "female")
            ) {
                continue;
            }

            // Distance check
            const distanceInKm = distanceBetween([lat, lng], center);
            const distanceInM = distanceInKm * 1000;

            if (distanceInM <= radiusInM) {
                matchingPartners.push({
                    ...partnerData,
                    id: docSnap.id,
                    distanceToRider: distanceInM
                });
            }
        }
    }

    // 5. No drivers found → cancel ride
    if (matchingPartners.length === 0) {
        console.log(`[Dispatch] No available partners found for ride ${rideId}.`);
        await rideRef.update({ status: "no_drivers_available" });
        return;
    }

    // 6. Sort & pick top 3
    matchingPartners.sort((a, b) => (a.distanceToRider || 99999) - (b.distanceToRider || 99999));
    const targets = matchingPartners.slice(0, 3);
    const targetIds = targets.map((p) => p.id);

    // 7. Assign to drivers
    if (targetIds.length > 0) {
        console.log(`[Dispatch] Assigning ride ${rideId} to:`, targetIds);
        await rideRef.update({
            pendingDriverIds: FieldValue.arrayUnion(...targetIds)
        });
    }
};
export const createRide = async (rideData: any) => {
    const rideRef = await db.collection("rides").add({
      ...rideData,
      status: "searching",
      createdAt: Date.now()
    });
  
    return { id: rideRef.id, data: rideData };
  };
  