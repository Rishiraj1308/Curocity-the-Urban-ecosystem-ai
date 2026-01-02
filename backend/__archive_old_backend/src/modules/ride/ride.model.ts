import { GeoPoint } from 'firebase-admin/firestore';

export interface Partner {
    id: string;
    currentLocation?: GeoPoint;
    
    // ✅ YE FIELD SABSE ZAROORI HAI (Iske bina naya logic samjh nahi aayega)
    geohash?: string; 
    
    fcmToken?: string;
    distanceToRider?: number;
    
    // Optional: Type safety ke liye ye bhi add kar sakta hai (Recommended)
    vehicleType?: string;
    isOnline?: boolean;
    liveStatus?: string;

    // Ye "Jugaad" line hai jo extra fields allow karti hai
    [key: string]: any; 
}

export interface Ride {
    id: string;
    pickup: {
        location: GeoPoint;
        address: string;
    };
    destination: {
        location: GeoPoint;
        address: string;
    };
    rideType: string;
    status: string;
    rejectedBy?: string[];
    createdAt: any;
    fare: number;
}