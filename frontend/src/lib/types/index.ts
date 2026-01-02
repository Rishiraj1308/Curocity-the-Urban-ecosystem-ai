import type { Timestamp, GeoPoint } from 'firebase/firestore';

// ✅ 1. PARTNER DATA (Driver Profile)
export interface PartnerData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  isOnline?: boolean;
  
  // 🔥 Live Tracking Fields
  liveStatus?: 'online' | 'on_trip' | 'offline'; 
  currentLocation?: GeoPoint;
  geohash?: string;
  lastLocationUpdate?: any; 
  currentRideId?: string | null;
  
  // Vehicle & Personal Info
  vehicleType?: string; 
  vehicleNumber?: string;
  vehicleModel?: string;
  partnerId?: string;
  photoUrl?: string;
  rating?: number;
  totalRides?: number; // Added for invoice sequencing
}

// ✅ 2. RIDE DATA (Cab Booking)
export interface RideData {
  id: string;
  status:
    | "searching"
    | "accepted"
    | "arriving"        
    | "arrived"
    | "in-progress"     
    | "in_progress"     // Handling both spellings just in case
    | "payment_pending"
    | "completed"
    | "cancelled_by_rider"
    | "cancelled_by_driver"
    | "cancelled_by_user"
    | "no_drivers_available";

  // Location Info
  pickup?: { address: string; location: GeoPoint };
  destination?: { address: string; location: GeoPoint };
  distance?: number;
  duration?: number; // Estimated time in mins

  // Rider Info
  userId?: string;     // Added for compatibility
  riderId: string;
  riderName?: string;
  riderGender?: string;
  riderPhone?: string;
  riderPhotoUrl?: string;

  // Driver Info (Direct Fields)
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;     
  driverPhotoUrl?: string;   // 🔥 Added: Code expects this
  
  // Vehicle Info (Supporting multiple naming conventions)
  driverVehicleNumber?: string;
  driverVehicleModel?: string;
  driverCarNumber?: string;  // 🔥 Added: Code expects this
  driverCarModel?: string;   // 🔥 Added: Code expects this
  
  driverLocation?: GeoPoint;
  driverRating?: number; 
  driverEta?: number;    
  
  // Driver Info (Nested Object - Legacy Support)
  driverDetails?: {
      name?: string;
      phone?: string;
      photoUrl?: string;
      vehicle?: string;
      vehicleNumber?: string;
      vehicleModel?: string;
      rating?: number;
      dob?: string;
  };

  // Payment & Verification
  vehicleNumber?: string;
  rideType?: string; // 'car', 'bike', 'auto'
  otp?: string;
  
  // 🔥 Payment Status
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentMethod?: string; // 'cash', 'wallet', 'upi'
  invoiceId?: string;
  invoiceDate?: any; // 🔥 Added: For bill generation
  fare?: number;

  // Timestamps
  createdAt: Timestamp | any; 
  startedAt?: string;
  completedAt?: string;
  startTime?: any;
  endTime?: any;

  // Backend Logic
  pendingDriverIds?: string[];
  rejectedBy?: string[]; 
}

// ✅ 3. GARAGE REQUEST (Mechanic)
export interface GarageRequest {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  status: 'searching' | 'accepted' | 'in_progress' | 'completed' | 'cancelled_by_user';
  
  // Mechanic Info
  mechanicId?: string;
  mechanicName?: string;
  mechanicPhone?: string;
  
  // Issue Details
  issue?: string;
  details?: string;
  location?: GeoPoint | { latitude: number; longitude: number };
  locationAddress?: string;
  
  createdAt: any;
}

// ✅ 4. AMBULANCE CASE (Emergency)
export interface AmbulanceCase {
  id: string;
  riderId: string; 
  status: 'searching' | 'dispatched' | 'arrived' | 'completed' | 'cancelled_by_user';
  
  // Medical Info
  severity?: 'critical' | 'moderate' | 'low';
  hospitalId?: string;
  
  // Assigned Ambulance Info
  assignedPartner?: {
      id?: string;
      name: string;
      phone: string;
      vehicleNumber?: string;
  };
  assignedAmbulanceName?: string;
  
  // Location
  location?: GeoPoint | { latitude: number; longitude: number };
  
  createdAt: any;
}

// ✅ 5. USER / CLIENT SESSION
export interface ClientSession {
    userId: string;
    name: string;
    phone: string;
    gender?: 'male' | 'female' | 'other';
    photoURL?: string;
    role?: string;
    id?: string;
    
    // 🔥 Added common profile fields used in logic
    displayName?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}