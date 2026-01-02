'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Car, FileText, Fingerprint, BadgeCheck, ArrowLeft, Star, Wallet, Activity } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, value }: { icon?: React.ElementType, label: string, value: string | undefined }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3">
            {Icon && <div className="p-2 rounded-full bg-white/5"><Icon className="w-4 h-4 text-gray-400" /></div>}
            <span className="text-sm text-gray-400">{label}</span>
        </div>
        <span className="font-medium text-sm text-white">{value || 'N/A'}</span>
    </div>
);

export default function DriverProfilePage() {
    const { user, db } = useFirebase();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) return;
        const fetchProfile = async () => {
            const docRef = doc(db, 'pathPartners', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) setProfile(snap.data());
            else setProfile({ // Fallback for demo
                name: user.displayName || "Captain",
                phone: user.phoneNumber || "+91 9876543210",
                rating: 4.9,
                vehicleModel: "Maruti Swift",
                vehicleNumber: "DL 01 AB 1234",
                vehicleType: "Cab Prime",
                drivingLicence: "DL-1420110012345",
                aadhaarNumber: "xxxx-xxxx-1234",
                totalEarnings: 12450
            });
            setLoading(false);
        };
        fetchProfile();
    }, [user, db]);

    if (loading) return <div className="min-h-screen bg-black p-6"><Skeleton className="h-40 w-full bg-white/10 rounded-2xl" /></div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/driver">
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></button>
                </Link>
                <h1 className="text-xl font-bold">My Profile</h1>
            </div>

            <div className="space-y-6">
                {/* Header Card */}
                <Card className="bg-[#121212] border-white/10 text-white overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-6 flex flex-col items-center text-center">
                        <Avatar className="w-24 h-24 border-4 border-[#121212] shadow-xl mb-4">
                            <AvatarImage src={profile?.photoUrl} />
                            <AvatarFallback className="text-2xl bg-gray-800">{profile?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-bold">{profile?.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/20">
                                <Star className="w-3 h-3 fill-current" /> {profile?.rating}
                            </span>
                            <span className="text-xs text-gray-500">| {profile?.vehicleType}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 border-t border-white/10 divide-x divide-white/10">
                        <div className="p-4 text-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Earnings</div>
                            <div className="text-xl font-bold text-emerald-500 flex justify-center items-center gap-1"><Wallet className="w-4 h-4" /> ₹{profile?.totalEarnings}</div>
                        </div>
                        <div className="p-4 text-center">
                            <div className="text-gray-400 text-xs uppercase mb-1">Rides</div>
                            <div className="text-xl font-bold text-white flex justify-center items-center gap-1"><Activity className="w-4 h-4" /> {profile?.totalRides || 0}</div>
                        </div>
                    </div>
                </Card>

                {/* Details */}
                <Card className="bg-[#121212] border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Car className="w-4 h-4" /> Vehicle & Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DetailItem icon={Phone} label="Phone" value={profile?.phone} />
                        <DetailItem icon={Car} label="Vehicle Model" value={profile?.vehicleModel} />
                        <DetailItem label="Vehicle No." value={profile?.vehicleNumber} />
                    </CardContent>
                </Card>

                <Card className="bg-[#121212] border-white/10 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DetailItem icon={BadgeCheck} label="Driving Licence" value={profile?.drivingLicence} />
                        <DetailItem icon={Fingerprint} label="Aadhaar" value={profile?.aadhaarNumber} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}