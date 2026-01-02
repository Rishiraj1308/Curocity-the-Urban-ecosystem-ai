// src/lib/firebase/ride-service.ts
import {
  addDoc,
  collection,
  serverTimestamp,
  GeoPoint,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { RideData } from '@/lib/types';

interface CreateRideInput {
  riderId: string;
  riderName?: string;
  pickup: { address: string; coords: { lat: number; lon: number } };
  destination: { address: string; coords: { lat: number; lon: number } };
  rideType: string;
  fare: number;
  otp: string;
}

export const RideService = {
  async create(db: any, input: CreateRideInput): Promise<string> {
    const payload: Partial<RideData> = {
      riderId: input.riderId,
      riderName: input.riderName,
      status: 'searching', 
      rideType: input.rideType,
      otp: input.otp,
      fare: input.fare,
      pickup: {
        address: input.pickup.address,
        location: new GeoPoint(
          input.pickup.coords.lat,
          input.pickup.coords.lon
        ),
      },
      destination: {
        address: input.destination.address,
        location: new GeoPoint(
          input.destination.coords.lat,
          input.destination.coords.lon
        ),
      },
      createdAt: serverTimestamp() as any,
    };

    const ref = await addDoc(collection(db, 'rides'), payload);
    return ref.id;
  },

  async updateStatus(db: any, rideId: string, status: RideData['status']) {
    await updateDoc(doc(db, 'rides', rideId), { status });
  },

  async attachDriver(
    db: any,
    rideId: string,
    driver: {
      id: string;
      name: string;
      phone: string;
      vehicle: string;
      vehicleNumber: string;
      rating?: number;
      location: GeoPoint;
    }
  ) {
    await updateDoc(doc(db, 'rides', rideId), {
      driverId: driver.id,
      driverDetails: {
        name: driver.name,
        vehicle: driver.vehicle,
        rating: driver.rating ?? 5,
        photoUrl: '',
        phone: driver.phone,
        location: driver.location,
      },
      vehicleNumber: driver.vehicleNumber,
      status: 'accepted',
    });
  },
};
