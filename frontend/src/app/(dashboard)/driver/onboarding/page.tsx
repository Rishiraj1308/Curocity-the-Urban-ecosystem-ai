
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { doc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore"
import { RecaptchaVerifier, signInWithPhoneNumber, type User as FirebaseUser } from "firebase/auth"
import { 
    ArrowLeft, User, Phone, ShieldCheck, Car, Banknote, 
    HeartPulse, Loader2, Calendar, Droplet, MapPin, CreditCard, FileText
} from 'lucide-react'
import { useFirebase } from '@/lib/firebase/client-provider'
import { generateSmartId } from "@/lib/firebase/idGenerator"
import BrandLogo from '@/components/shared/brand-logo'

export default function PathOnboardingPage() {
    const router = useRouter()
    const { db, auth } = useFirebase()
    
    // Auth & Loading States
    const [user, setUser] = useState<FirebaseUser | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(0) // 0=Login, 1=Info, 2=KYC, 3=Bank, 4=Vehicle
    
    // OTP States
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState('')
    const [confirmResult, setConfirmResult] = useState<any>(null)
    const [otpSent, setOtpSent] = useState(false)

    // Data Form (25+ Fields)
    const [formData, setFormData] = useState({
        name: '', phone: '', gender: '', dob: '', bloodGroup: '',
        aadhaarNumber: '', panCard: '', drivingLicence: '', address: '', city: '',
        upiId: '', emergencyName: '', emergencyPhone: '',
        vehicleType: '', vehicleBrand: '', vehicleModel: '', vehicleNumber: '',
    });

    // 1. Session Check (Hybrid Logic)
    useEffect(() => {
        const unsub = auth?.onAuthStateChanged((u) => {
            if (u) {
                setUser(u);
                setFormData(p => ({ ...p, phone: u.phoneNumber || '' }));
                if (step === 0) setStep(1);
            } else {
                setStep(0);
            }
            setIsCheckingAuth(false);
        });
        return () => unsub?.();
    }, [auth, step]);

    // 2. OTP Logic
    const onCaptchVerify = () => {
        if (!(window as any).recaptchaVerifier && auth) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible', 'callback': () => {}, 'expired-callback': () => {}
            });
        }
    }

    const sendOtp = async () => {
        if (phoneNumber.length < 10) return toast.error("Valid Phone Number Required");
        if (!auth) return;
        setIsLoading(true);
        onCaptchVerify();
        const appVerifier = (window as any).recaptchaVerifier;
        const formatPh = "+91" + phoneNumber;

        try {
            const confirmationResult = await signInWithPhoneNumber(auth, formatPh, appVerifier);
            setConfirmResult(confirmationResult);
            setOtpSent(true);
            toast.success("OTP Sent!");
        } catch (error) { toast.error("SMS Failed"); } finally { setIsLoading(false); }
    }

    const verifyOtp = async () => {
        if (!confirmResult) return;
        setIsLoading(true);
        try {
            const res = await confirmResult.confirm(otp);
            setUser(res.user);
            setFormData(p => ({ ...p, phone: res.user.phoneNumber || '' }));
            toast.success("Verified!");
            setStep(1);
        } catch (err) { toast.error("Invalid OTP"); } finally { setIsLoading(false); }
    }

    const updateForm = (field: string, val: string) => setFormData(p => ({ ...p, [field]: val }));

    const handleFinalSubmit = async () => {
        if (!user) return toast.error("Session Missing");
        if(formData.aadhaarNumber.length !== 12) return toast.error("Invalid Aadhaar");

        setIsLoading(true);
        try {
            const sId = await generateSmartId("pathPartners", "CZP");
            
            // ✅ FIX: The document ID MUST BE the user's UID from Firebase Auth.
            const partnerDocRef = doc(db, "pathPartners", user.uid);

            await setDoc(partnerDocRef, {
                ...formData,
                authUid: user.uid,
                partnerId: sId,
                phone: user.phoneNumber,
                status: 'pending_verification', 
                liveStatus: 'offline',          
                isOnline: false, isVerified: false, 
                walletBalance: 0, rating: 5.0, totalEarnings: 0, totalRides: 0,
                currentLocation: new GeoPoint(28.5920, 77.3668),
                createdAt: serverTimestamp(),
            }, { merge: true });

            toast.success("Application Submitted!");
            router.push('/partner-login');
        } catch (e) { toast.error("Sync Failed"); } finally { setIsLoading(false); }
    }

    if (isCheckingAuth) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

    return (
        <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div id="recaptcha-container"></div>
            
            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black uppercase italic text-emerald-500 tracking-tighter">
                        {step === 0 ? "Partner Login" : "Complete Profile"}
                    </h1>
                    {step > 0 && (
                        <div className="flex gap-1 mt-4 justify-center">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 backdrop-blur-md rounded-[2rem] p-6 shadow-2xl">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 0: OTP LOGIN */}
                        {step === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                {!otpSent ? (
                                    <>
                                        <Input className="h-16 text-lg bg-black border-zinc-700 rounded-2xl tracking-widest pl-4" placeholder="9876543210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} />
                                        <Button className="h-14 w-full bg-emerald-600 rounded-xl font-bold uppercase" onClick={sendOtp} disabled={isLoading}>Get OTP</Button>
                                    </>
                                ) : (
                                    <>
                                        <Input className="h-16 text-2xl text-center bg-black border-zinc-700 rounded-2xl tracking-[1em]" placeholder="XXXXXX" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
                                        <Button className="h-14 w-full bg-emerald-600 rounded-xl font-bold uppercase" onClick={verifyOtp} disabled={isLoading}>Verify</Button>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 1: PERSONAL INFO (Ola Style) */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                                <header className="flex items-center gap-2 text-emerald-400 mb-2"><User size={20} /><h2 className="font-bold uppercase">About You</h2></header>
                                
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-500 uppercase ml-1">Full Legal Name</Label>
                                    <Input className="h-14 bg-black border-zinc-800 rounded-xl focus:border-emerald-500" value={formData.name} onChange={e => updateForm('name', e.target.value)} />
                                </div>

                                {/* Gender Cards (Ola Style) */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-zinc-500 uppercase ml-1">Gender</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['male', 'female'].map(g => (
                                            <div key={g} onClick={() => updateForm('gender', g)} 
                                                className={`h-12 flex items-center justify-center rounded-xl border cursor-pointer font-bold uppercase text-xs transition-all ${formData.gender === g ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                                                {g}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-zinc-500 uppercase ml-1">Date of Birth</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <Input type="date" className="h-14 pl-10 bg-black border-zinc-800 rounded-xl text-xs uppercase" value={formData.dob} onChange={e => updateForm('dob', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-zinc-500 uppercase ml-1">Blood Group</Label>
                                        <div className="relative">
                                            <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <Input className="h-14 pl-10 bg-black border-zinc-800 rounded-xl uppercase font-bold" placeholder="O+" maxLength={3} value={formData.bloodGroup} onChange={e => updateForm('bloodGroup', e.target.value.toUpperCase())} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><Phone size={14} className="text-emerald-500" /></div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Verified Number</p>
                                        <p className="text-sm font-mono font-bold text-white">{user?.phoneNumber}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: KYC & ADDRESS */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                                <header className="flex items-center gap-2 text-emerald-400 mb-2"><ShieldCheck size={20} /><h2 className="font-bold uppercase">Documents</h2></header>
                                
                                <div className="space-y-4">
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                        <Input className="h-14 pl-12 bg-black border-zinc-800 rounded-xl tracking-widest" placeholder="Aadhaar (12 Digits)" maxLength={12} value={formData.aadhaarNumber} onChange={e => updateForm('aadhaarNumber', e.target.value.replace(/\D/g, ''))} />
                                    </div>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                        <Input className="h-14 pl-12 bg-black border-zinc-800 rounded-xl uppercase" placeholder="PAN Number" maxLength={10} value={formData.panCard} onChange={e => updateForm('panCard', e.target.value.toUpperCase())} />
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                        <Input className="h-14 pl-12 bg-black border-zinc-800 rounded-xl" placeholder="Current City" value={formData.city} onChange={e => updateForm('city', e.target.value)} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: BANK & SOS */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                                <header className="flex items-center gap-2 text-emerald-400 mb-2"><Banknote size={20} /><h2 className="font-bold uppercase">Payouts</h2></header>
                                
                                <Input className="h-14 bg-black border-zinc-800 rounded-xl text-emerald-500 font-mono" placeholder="UPI ID (e.g. name@okaxis)" value={formData.upiId} onChange={e => updateForm('upiId', e.target.value)} />
                                
                                <div className="p-4 bg-zinc-800/30 rounded-2xl space-y-3 border border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase"><HeartPulse size={14} /> SOS Contact</div>
                                    <Input className="h-12 bg-black border-zinc-700 rounded-xl" placeholder="Relative Name" value={formData.emergencyName} onChange={e => updateForm('emergencyName', e.target.value)} />
                                    <Input className="h-12 bg-black border-zinc-700 rounded-xl" placeholder="Phone Number" maxLength={10} value={formData.emergencyPhone} onChange={e => updateForm('emergencyPhone', e.target.value.replace(/\D/g, ''))} />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: VEHICLE */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-5">
                                <header className="flex items-center gap-2 text-emerald-400 mb-2"><Car size={20} /><h2 className="font-bold uppercase">Vehicle</h2></header>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    {['bike', 'auto', 'cab'].map(t => (
                                        <div key={t} onClick={() => updateForm('vehicleType', t)} 
                                            className={`h-16 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all ${formData.vehicleType === t ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black text-zinc-500 border-zinc-800'}`}>
                                            <span className="text-[10px] font-black uppercase">{t}</span>
                                        </div>
                                    ))}
                                </div>

                                <Input className="h-14 bg-black border-zinc-800 rounded-xl uppercase font-mono tracking-widest" placeholder="Plate No (DL01AB1234)" value={formData.vehicleNumber} onChange={e => updateForm('vehicleNumber', e.target.value.toUpperCase())} />
                                <Input className="h-14 bg-black border-zinc-800 rounded-xl uppercase" placeholder="DL Number" value={formData.drivingLicence} onChange={e => updateForm('drivingLicence', e.target.value.toUpperCase())} />
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex gap-3">
                        {step > 1 && (
                            <Button variant="outline" className="h-14 w-14 rounded-xl border-zinc-800 bg-black hover:bg-zinc-900" onClick={() => setStep(s => s - 1)}>
                                <ArrowLeft size={20} />
                            </Button>
                        )}
                        {step > 0 && (
                            <Button className="h-14 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase italic tracking-wider" onClick={() => step < 4 ? setStep(s => s + 1) : handleFinalSubmit()} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : (step === 4 ? "Submit Application" : "Next")}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
