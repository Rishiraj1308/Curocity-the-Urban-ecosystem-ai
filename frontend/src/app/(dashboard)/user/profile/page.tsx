'use client'

import * as React from "react"
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, LogOut, Camera, Shield, Activity, ArrowRight, Loader2, HeartPulse, Droplets, Car, IndianRupee, VenetianMask, Cake, Phone, Siren, Calendar, Wrench, FlaskConical, Home, Briefcase, FileText, Pencil, Save, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebase } from '@/lib/firebase/client-provider'
import { doc, getDoc, collection, query, where, getDocs, Timestamp, updateDoc, orderBy } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, differenceInYears } from "date-fns"
import type { RideData, AmbulanceCase, GarageRequest } from "@/lib/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// 🔥 LOCAL TYPE DEFINITIONS
interface Appointment {
    id: string;
    doctorName: string;
    hospitalName?: string;
    date: Timestamp;
    status: string;
    createdAt: Timestamp;
    type?: string; 
    patientId?: string;
}

interface UserProfileData {
    name: string;
    phone: string;
    email?: string;
    gender?: 'male' | 'female' | 'other';
    dob?: string; 
    isOnline?: boolean;
    lastSeen?: Timestamp;
    photoURL?: string;
    createdAt?: Timestamp;
    healthProfile?: {
        bloodGroup: string;
        allergies: string;
        conditions: string;
    };
    insurance?: {
        provider: string;
        policyNumber: string;
    }
}

// 🔥 REUSABLE GLASS CARD COMPONENT
const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "rounded-[2rem] border backdrop-blur-xl transition-all duration-300",
        "bg-white/60 border-white/40 shadow-sm",
        "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
        className
    )}>
        {children}
    </div>
)

// 🔥 REUSABLE STAT TILE
const StatTile = ({ icon: Icon, value, label, colorClass, href }: any) => (
    <Link href={href || '#'}>
        <div className={cn(
            "p-4 rounded-3xl border transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center text-center h-full",
            "bg-white/40 border-white/20 hover:bg-white/60",
            "dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10"
        )}>
            <div className={cn("p-2 rounded-full mb-2 bg-white/50 dark:bg-white/10", colorClass)}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-white/40">{label}</p>
        </div>
    </Link>
)

// 🔥 CUSTOM DETAIL ITEM
const DetailItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/5">
        <div className="p-2 rounded-xl bg-white/50 dark:bg-white/10">
            <Icon className="w-4 h-4 text-gray-600 dark:text-white/70" />
        </div>
        <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white/30">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">{value || 'Not set'}</p>
        </div>
    </div>
)

export default function UserProfilePage() {
    const { user, isUserLoading, auth, db, firebaseApp } = useFirebase();
    const router = useRouter();
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    
    // Activity Data
    const [rides, setRides] = useState<RideData[]>([]);
    const [sosCases, setSosCases] = useState<AmbulanceCase[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [garageRequests, setGarageRequests] = useState<GarageRequest[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- EDIT STATES ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingHealth, setIsEditingHealth] = useState(false);
    const [isEditingInsurance, setIsEditingInsurance] = useState(false);

    // Form Data
    const [personalData, setPersonalData] = useState({ name: '', phone: '', gender: '', dob: '' });
    const [healthProfile, setHealthProfile] = useState({ bloodGroup: '', allergies: '', conditions: '' });
    const [insurance, setInsurance] = useState({ provider: '', policyNumber: '' });

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || !db) {
            router.push('/login?role=user');
            return;
        }

        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch User Profile
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfileData;
                    setProfileData(data);
                    
                    // Initialize Edit Forms
                    setPersonalData({
                        name: data.name || user.displayName || '',
                        phone: data.phone || user.phoneNumber || '',
                        gender: data.gender || '',
                        dob: data.dob || ''
                    });
                    if (data.healthProfile) setHealthProfile(data.healthProfile);
                    if (data.insurance) setInsurance(data.insurance);
                } else {
                    const initialData = {
                        name: user.displayName || 'User',
                        phone: user.phoneNumber || '',
                        email: user.email || '',
                        photoURL: user.photoURL || undefined
                    };
                    setProfileData(initialData as UserProfileData);
                    setPersonalData({
                        name: initialData.name,
                        phone: initialData.phone,
                        gender: '',
                        dob: ''
                    });
                }
                
                // Fetch Activity
                const ridesQuery = query(collection(db, 'rides'), where('riderId', '==', user.uid), orderBy('createdAt', 'desc'));
                const casesQuery = query(collection(db, 'emergencyCases'), where('riderId', '==', user.uid), orderBy('createdAt', 'desc'));
                const appointmentsQuery = query(collection(db, 'appointments'), where('patientId', '==', user.uid), orderBy('createdAt', 'desc'));
                const garageRequestsQuery = query(collection(db, 'garageRequests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

                const [ridesSnapshot, casesSnapshot, appointmentsSnapshot, garageRequestsSnapshot] = await Promise.all([
                    getDocs(ridesQuery),
                    getDocs(casesQuery),
                    getDocs(appointmentsQuery),
                    getDocs(garageRequestsQuery),
                ]);

                setRides(ridesSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as RideData));
                setSosCases(casesSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as AmbulanceCase));
                setAppointments(appointmentsSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as Appointment));
                setGarageRequests(garageRequestsSnapshot.docs.map(d => ({id: d.id, ...d.data()}) as GarageRequest));

            } catch (error) {
                console.error("Error fetching user data:", error);
                toast.error("Error", { description: "Could not load profile data."});
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllData();

    }, [user, isUserLoading, db, router]);

    // --- ACTIONS ---

    const handleLogout = () => {
        if (!auth) return;
        if (user?.uid && db) {
            updateDoc(doc(db, 'users', user.uid), { isOnline: false });
        }
        auth.signOut().then(() => {
            localStorage.removeItem('curocity-session');
            router.push('/login?role=user');
            toast.success('Logged Out');
        });
    };

    const handleSaveProfile = async () => {
        if (!user || !db) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                name: personalData.name,
                phone: personalData.phone,
                gender: personalData.gender,
                dob: personalData.dob
            });
            setProfileData(prev => prev ? { ...prev, ...personalData } as UserProfileData : null);
            setIsEditingProfile(false);
            toast.success("Profile updated successfully!");
        } catch(e) { toast.error("Update failed"); }
    }

    const handleSaveHealth = async () => {
        if (!user || !db) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { healthProfile });
            setProfileData(prev => prev ? { ...prev, healthProfile } : null);
            setIsEditingHealth(false);
            toast.success("Health info updated");
        } catch(e) { toast.error("Update failed"); }
    }

    const handleSaveInsurance = async () => {
        if (!user || !db) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { insurance });
            setProfileData(prev => prev ? { ...prev, insurance } : null);
            setIsEditingInsurance(false);
            toast.success("Insurance info updated");
        } catch(e) { toast.error("Update failed"); }
    }

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user || !db || !firebaseApp) return;
        const file = event.target.files[0];
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        setIsUploading(true);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
            setProfileData(prev => prev ? { ...prev, photoURL: downloadURL } : null);
            toast.success('Photo updated!');
        } catch (error) { toast.error('Upload Failed'); } finally { setIsUploading(false); }
    };

    const getAge = (dobString?: string) => {
        if (!dobString) return 'N/A';
        try {
            const age = differenceInYears(new Date(), new Date(dobString));
            return `${age} years`;
        } catch { return 'N/A'; }
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        return names.length > 1 ? names[0][0] + names[1][0] : name.substring(0, 2);
    }

    // --- MEMOS ---

    const allActivities = useMemo(() => {
        const activities = [
            ...rides.map(r => ({ type: 'Ride', ...r, title: `Ride to ${r.destination?.address?.split(',')[0] || 'destination'}`, description: `Partner: ${r.driverDetails?.name || 'N/A'}` })),
            ...sosCases.map(c => ({ type: 'SOS', ...c, title: `Emergency SOS`, description: `Hospital: ${c.assignedPartner?.name || 'N/A'}` })),
            ...appointments.map(a => ({ type: 'Appointment', ...a, title: `Dr. ${a.doctorName}`, description: a.hospitalName || '' })),
            ...garageRequests.map(g => ({ type: 'ResQ', ...g, title: `ResQ: ${g.issue}`, description: `Mechanic: ${g.mechanicName || 'N/A'}` })),
        ];
        return activities.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }, [rides, sosCases, appointments, garageRequests]);

    const stats = React.useMemo(() => {
        const completedRides = rides.filter(r => r.status === 'completed');
        const totalSpend = completedRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        return {
            totalRides: rides.length,
            totalSpend,
            totalSos: sosCases.length,
            totalAppointments: appointments.length,
            totalResq: garageRequests.length,
        };
    }, [rides, sosCases, appointments, garageRequests]);

    const getStatusBadge = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('completed')) return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300 border-0">{status}</Badge>;
        return <Badge variant="secondary" className="capitalize bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white border-0">{lowerStatus}</Badge>;
    }

    const ActivityIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'Ride': return <Car className="w-4 h-4 text-cyan-500" />;
            case 'SOS': return <Siren className="w-4 h-4 text-red-500" />;
            case 'Appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'ResQ': return <Wrench className="w-4 h-4 text-amber-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    if (isLoading || !profileData) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-4 md:p-6 space-y-8 pb-32">
            
            <div className="md:pl-0">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Profile.</h2>
                <p className="text-sm text-gray-500 dark:text-white/50">Manage your identity & records.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: IDENTITY & HEALTH */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* IDENTITY CARD */}
                    <GlassCard className="p-6 flex flex-col items-center text-center">
                        
                        {/* EDIT PERSONAL INFO DIALOG */}
                        <div className="w-full flex justify-end">
                            <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-500"><Pencil className="w-4 h-4"/></Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-[#111] border-gray-200 dark:border-white/10">
                                    <DialogHeader>
                                        <DialogTitle className="dark:text-white">Edit Personal Info</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input value={personalData.name} onChange={(e) => setPersonalData({...personalData, name: e.target.value})} className="dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input value={personalData.phone} onChange={(e) => setPersonalData({...personalData, phone: e.target.value})} className="dark:bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Gender</Label>
                                                <Select value={personalData.gender} onValueChange={(val) => setPersonalData({...personalData, gender: val})}>
                                                    <SelectTrigger className="dark:bg-white/5"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date of Birth</Label>
                                                <Input type="date" value={personalData.dob} onChange={(e) => setPersonalData({...personalData, dob: e.target.value})} className="dark:bg-white/5" />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* PHOTO */}
                        <div className="relative group -mt-4">
                            <Avatar className="w-28 h-28 border-4 border-white/50 dark:border-white/10 shadow-lg">
                                {/* Auto-load Google Photo */}
                                <AvatarImage src={profileData.photoURL || user?.photoURL || undefined} alt={profileData.name} className="object-cover"/>
                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                                    {getInitials(profileData.name)}
                                </AvatarFallback>
                            </Avatar>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/png, image/jpeg" className="hidden" />
                            <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md border border-white/20" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4"/>}
                            </Button>
                        </div>
                        
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h3>
                            <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mt-1">
                                Member since {profileData.createdAt ? profileData.createdAt.toDate().getFullYear() : '2024'}
                            </p>
                        </div>

                        <div className="w-full mt-6 space-y-3 text-left">
                            <DetailItem icon={Phone} label="Phone" value={profileData.phone} />
                            <DetailItem icon={VenetianMask} label="Gender" value={profileData.gender} />
                            {/* Auto Age from DOB */}
                            <DetailItem icon={Cake} label="Age" value={getAge(profileData.dob)} />
                            
                            <div className="flex justify-between items-center p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/5">
                                <span className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase">Status</span>
                                <Badge className={profileData.isOnline ? 'bg-green-500/20 text-green-600 border-0' : 'bg-gray-500/20 text-gray-500 border-0'}>
                                    {profileData.isOnline ? 'Online' : 'Offline'}
                                </Badge>
                            </div>
                        </div>
                    </GlassCard>

                    {/* HEALTH CARD (Editable) */}
                    <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><HeartPulse className="w-5 h-5"/></div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Health Info</h3>
                            </div>
                            <Dialog open={isEditingHealth} onOpenChange={setIsEditingHealth}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-500"><Pencil className="w-4 h-4"/></Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-[#111] border-gray-200 dark:border-white/10">
                                    <DialogHeader>
                                        <DialogTitle className="dark:text-white">Edit Health Profile</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Blood Group</Label>
                                            <Input value={healthProfile.bloodGroup} onChange={(e) => setHealthProfile({...healthProfile, bloodGroup: e.target.value})} placeholder="e.g. O+" className="dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Allergies</Label>
                                            <Input value={healthProfile.allergies} onChange={(e) => setHealthProfile({...healthProfile, allergies: e.target.value})} placeholder="e.g. Peanuts" className="dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Conditions</Label>
                                            <Input value={healthProfile.conditions} onChange={(e) => setHealthProfile({...healthProfile, conditions: e.target.value})} placeholder="e.g. None" className="dark:bg-white/5" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleSaveHealth}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <DetailItem icon={Droplets} label="Blood Group" value={healthProfile?.bloodGroup} />
                        <div className="p-3 rounded-2xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/5">
                            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white/30 mb-1">Allergies</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{healthProfile?.allergies || 'None specified'}</p>
                        </div>
                    </GlassCard>

                    {/* INSURANCE CARD (Editable) */}
                    <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Shield className="w-5 h-5"/></div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Insurance</h3>
                            </div>
                            <Dialog open={isEditingInsurance} onOpenChange={setIsEditingInsurance}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-500"><Pencil className="w-4 h-4"/></Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-[#111] border-gray-200 dark:border-white/10">
                                    <DialogHeader>
                                        <DialogTitle className="dark:text-white">Edit Insurance</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Provider Name</Label>
                                            <Input value={insurance.provider} onChange={(e) => setInsurance({...insurance, provider: e.target.value})} placeholder="e.g. LIC" className="dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Policy Number</Label>
                                            <Input value={insurance.policyNumber} onChange={(e) => setInsurance({...insurance, policyNumber: e.target.value})} placeholder="e.g. 123456" className="dark:bg-white/5" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleSaveInsurance}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <DetailItem icon={Briefcase} label="Provider" value={insurance?.provider} />
                        <DetailItem icon={FileText} label="Policy No." value={insurance?.policyNumber} />
                    </GlassCard>

                </div>

                {/* RIGHT: STATS & ACTIVITY */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* STATS GRID */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Activity Snapshot</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatTile href="/user/activity?filter=Ride" icon={Car} value={stats.totalRides} label="Rides" colorClass="text-cyan-500" />
                            <StatTile href="/user/activity?filter=ResQ" icon={Wrench} value={stats.totalResq} label="ResQ" colorClass="text-amber-500" />
                            <StatTile href="/user/activity?filter=SOS" icon={Siren} value={stats.totalSos} label="SOS" colorClass="text-red-500" />
                            <StatTile href="/user/activity?filter=Appointment" icon={Calendar} value={stats.totalAppointments} label="Visits" colorClass="text-blue-500" />
                        </div>
                        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">Total Spend</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">₹{stats.totalSpend.toLocaleString()}</p>
                            </div>
                            <IndianRupee className="w-8 h-8 text-cyan-500/20" />
                        </div>
                    </GlassCard>

                    {/* RECENT ACTIVITY TABLE */}
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50 dark:bg-white/5">
                                    <TableRow className="border-b border-gray-100 dark:border-white/5 hover:bg-transparent">
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead className="text-xs uppercase font-bold text-gray-400">Service</TableHead>
                                        <TableHead className="text-xs uppercase font-bold text-gray-400">Date</TableHead>
                                        <TableHead className="text-xs uppercase font-bold text-gray-400 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allActivities.length > 0 ? (
                                        allActivities.slice(0, 5).map((activity) => (
                                            <TableRow key={activity.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <TableCell className="pl-6">
                                                    <div className="p-2 rounded-full bg-gray-100 dark:bg-white/10 w-fit">
                                                        <ActivityIcon type={activity.type} />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{activity.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-white/50">{activity.description}</p>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 dark:text-white/50">
                                                    {activity.createdAt ? format(activity.createdAt.toDate(), 'MMM d, yyyy') : '-'}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {getStatusBadge(activity.status)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-500 dark:text-white/40">
                                                No recent activity found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-white/5">
                            <Button asChild variant="ghost" className="w-full text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10">
                                <Link href="/user/activity" className="flex items-center justify-center gap-2">
                                    View Full History <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    </GlassCard>

                    {/* LOGOUT BUTTON */}
                    <div className="flex justify-end">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900 dark:text-white">Sign out?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-500 dark:text-white/50">
                                        You will need to log in again to access your account.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-100 dark:bg-white/5 border-0 text-gray-900 dark:text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">Logout</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                </div>
            </div>
        </div>
    )
}