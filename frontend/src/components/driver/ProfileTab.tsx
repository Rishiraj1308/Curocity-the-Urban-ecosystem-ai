'use client';

import React, { useState } from 'react';
import { 
  Star, LogOut, Car, FileText, BadgeCheck, Fingerprint, 
  CheckCircle, Wallet, Phone, ChevronRight, 
  Droplet, Calendar, Heart, Siren, User, History, Headset, Pen
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion } from 'framer-motion';

// 🔥 EDIT POPUP IMPORTS
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase } from "@/lib/firebase/client-provider";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

// --- HELPER COMPONENTS ---
const DetailItem = ({ icon: Icon, label, value, isVerified = false }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
                <span className="font-bold text-sm text-white tracking-wide mt-0.5">{value || 'N/A'}</span>
            </div>
        </div>
        {isVerified && (
            <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
            </div>
        )}
    </div>
);

const HealthStat = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className="bg-[#121212] border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 hover:bg-white/5 transition-colors">
        <div className={`p-1.5 rounded-full ${colorClass} bg-opacity-20`}>
            <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
            <p className="text-sm font-bold text-white mt-0.5">{value || '-'}</p>
        </div>
    </div>
);

// --- 🔥 EDIT HEALTH DIALOG ---
function EditHealthDialog({ data }: { data: any }) {
  const { db } = useFirebase();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    age: data?.age || "",
    bloodGroup: data?.bloodGroup || "",
    gender: data?.gender || "male",
    emergencyContactName: data?.emergencyContactName || "",
    emergencyContactPhone: data?.emergencyContactPhone || "",
  });

  const handleSave = async () => {
    if (!db || !data?.id) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "pathPartners", data.id), {
        age: formData.age,
        bloodGroup: formData.bloodGroup,
        gender: formData.gender,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
      });
      toast.success("Health details updated!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-white/10 text-emerald-400">
          <Pen className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#121212] text-white border-white/10">
        <DialogHeader>
          <DialogTitle>Update Health Info</DialogTitle>
          <DialogDescription className="text-gray-400">Essential for emergency situations.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs uppercase">Age</Label>
              <Input type="number" className="bg-white/5 border-white/10 text-white" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="Years"/>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs uppercase">Gender</Label>
              <Select value={formData.gender} onValueChange={(val) => setFormData({...formData, gender: val})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase">Blood Group</Label>
            <Select value={formData.bloodGroup} onValueChange={(val) => setFormData({...formData, bloodGroup: val})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (<SelectItem key={bg} value={bg}>{bg}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-white/10 my-2 pt-2">
             <p className="text-xs font-bold text-red-400 uppercase mb-3">Emergency Contact</p>
             <div className="space-y-3">
                <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">Name</Label>
                    <Input className="bg-white/5 border-white/10 text-white" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="e.g. Brother"/>
                </div>
                <div className="space-y-1">
                    <Label className="text-gray-400 text-xs">Phone</Label>
                    <Input type="tel" className="bg-white/5 border-white/10 text-white" value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="98XXXXXXXX"/>
                </div>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- WALLET SHEET ---
const WalletSheet = ({ earnings }: { earnings: number }) => (
    <div className="h-full flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/10 text-left">
            <SheetTitle className="text-xl font-bold text-white">Earnings</SheetTitle>
            <SheetDescription className="text-gray-400 text-xs">Your income details.</SheetDescription>
        </SheetHeader>
        <div className="p-6">
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl mb-6">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Balance</p>
                <h3 className="text-4xl font-black text-white">₹{earnings || 0}</h3>
            </div>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl">Withdraw</Button>
        </div>
    </div>
);

// --- RIDE HISTORY SHEET ---
const RideHistorySheet = ({ totalRides }: { totalRides: number }) => (
    <div className="h-full flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/10 text-left">
            <SheetTitle className="text-xl font-bold text-white">Trip History</SheetTitle>
            <SheetDescription className="text-gray-400 text-xs">Total: {totalRides}</SheetDescription>
        </SheetHeader>
        <div className="p-6"><p className="text-gray-500 text-sm text-center">No recent trips.</p></div>
    </div>
);

// --- MAIN COMPONENT ---
export const ProfileTab = ({ data, logout }: any) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
            className="bg-[#050505] min-h-full pb-32 pt-6 px-5 overflow-y-auto h-full font-sans"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Profile</h1>
                    <p className="text-gray-500 text-xs mt-1">Captain ID: {data?.partnerId || '----'}</p>
                </div>
                <Button size="icon" variant="outline" className="rounded-full bg-white/5 border-white/10 text-white">
                    <Headset className="w-5 h-5" />
                </Button>
            </div>
            
            {/* HERO CARD */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#121212] border border-white/10 p-6 mb-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                <div className="flex flex-col items-center relative z-10 text-center">
                    <div className="relative mb-4">
                        <Avatar className="w-28 h-28 border-4 border-[#1a1a1a] shadow-2xl">
                            <AvatarImage src={data?.photoUrl} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-[#1a1a1a] text-white font-bold">{data?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-1.5 rounded-full">
                            <div className="bg-white text-black text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                {data?.rating || '5.0'} <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{data?.name}</h2>
                    <div className="flex items-center gap-2 mb-6">
                        <Badge variant="outline" className="border-white/10 text-gray-400 font-mono text-[10px] tracking-widest">{data?.vehicleType || 'Cab Prime'}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-left hover:bg-white/10 active:scale-95 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Earnings</span>
                                    </div>
                                    <p className="text-2xl font-black text-white">₹{data?.totalEarnings || 0}</p>
                                </button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh] bg-[#050505] border-t border-white/10 rounded-t-[2.5rem] p-0"><WalletSheet earnings={data?.totalEarnings} /></SheetContent>
                        </Sheet>
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-left hover:bg-white/10 active:scale-95 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <History className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Rides</span>
                                    </div>
                                    <p className="text-2xl font-black text-white">{data?.totalRides || 0}</p>
                                </button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh] bg-[#050505] border-t border-white/10 rounded-t-[2.5rem] p-0"><RideHistorySheet totalRides={data?.totalRides} /></SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* 🔥 HEALTH & SAFETY (With Edit Button) */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Heart className="w-3 h-3 text-red-500" /> Health & Safety
                    </h3>
                    <EditHealthDialog data={data} />
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <HealthStat icon={Droplet} label="Blood" value={data?.bloodGroup} colorClass="bg-red-500 text-red-500" />
                    <HealthStat icon={Calendar} label="Age" value={data?.age ? `${data.age} Yrs` : '-'} colorClass="bg-blue-500 text-blue-500" />
                    <HealthStat icon={User} label="Gender" value={data?.gender} colorClass="bg-purple-500 text-purple-500" />
                </div>

                <div className="bg-red-900/10 border border-red-500/20 rounded-[1.5rem] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/10 rounded-xl">
                            <Siren className="w-5 h-5 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Emergency Contact</p>
                            <p className="text-sm font-bold text-white">{data?.emergencyContactName || "Not Set"}</p>
                            <p className="text-xs text-gray-400">{data?.emergencyContactPhone || "----"}</p>
                        </div>
                    </div>
                    {data?.emergencyContactPhone && (
                        <a href={`tel:${data.emergencyContactPhone}`} className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                            <Phone className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>

            {/* DETAILS */}
            <div className="mb-8 space-y-4">
                <Card className="bg-[#121212] border-white/10 text-white rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Car className="w-4 h-4 text-blue-500" /> Vehicle</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <DetailItem icon={Car} label="Model" value={data?.vehicleModel} />
                        <DetailItem icon={FileText} label="Plate" value={data?.vehicleNumber} />
                    </CardContent>
                </Card>

                <Card className="bg-[#121212] border-white/10 text-white rounded-[1.5rem] overflow-hidden">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-500" /> Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <DetailItem icon={Phone} label="Phone" value={data?.phone} isVerified={true}/>
                        <DetailItem icon={BadgeCheck} label="Licence" value={data?.drivingLicence} isVerified={!!data?.drivingLicence}/>
                        <DetailItem icon={Fingerprint} label="Aadhaar" value={data?.aadhaarNumber} isVerified={!!data?.aadhaarNumber}/>
                    </CardContent>
                </Card>
            </div>
            
            {/* ACTIONS */}
            <div className="space-y-3">
                <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 justify-start px-4">
                    <Headset className="w-4 h-4 mr-3 text-emerald-400" /> Help & Support
                </Button>
                <Button variant="destructive" onClick={logout} className="w-full h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 justify-start px-4">
                    <LogOut className="w-4 h-4 mr-3" /> Sign Out
                </Button>
            </div>
        </motion.div>
    );
};