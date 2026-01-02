
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  motion, 
  AnimatePresence, 
  useMotionTemplate, 
  useMotionValue 
} from 'framer-motion'
import { 
  Loader2, ArrowRight, Lock, Phone, LayoutGrid, ArrowLeft, Sun, Moon, CheckCircle2 
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/shared/brand-logo'

// Firebase Imports
import { useFirebase } from '@/lib/firebase/client-provider'
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth'

// --- 1. VISUAL COMPONENTS (TERA ORIGINAL UI - NO CHANGE) ---

const NoiseOverlay = () => (
    <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.04] mix-blend-overlay">
        <svg className="w-full h-full">
            <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    </div>
)

const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const position = { x: useMotionValue(0), y: useMotionValue(0) };
    const opacity = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        position.x.set(e.clientX - rect.left);
        position.y.set(e.clientY - rect.top);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => opacity.set(1)}
            onMouseLeave={() => opacity.set(0)}
            className={cn(
                "relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl",
                "bg-neutral-900/80 border border-white/10 shadow-2xl shadow-black/50",
                className
            )}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: useMotionTemplate`radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16, 185, 129, 0.15), transparent 40%)`,
                }}
            />
            <div className="relative h-full z-10">
                {children}
            </div>
        </div>
    );
};

interface CreativeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: any;
}

const CreativeInput = ({ icon: Icon, className, ...props }: CreativeInputProps) => {
    return (
        <div className="relative group mb-5">
            <Icon className="absolute left-0 top-1/2 -translate-y-1/2 transition-colors size-5 text-white/40 group-focus-within:text-emerald-400" />
            <input 
                className={cn(
                    "w-full bg-transparent border-b border-white/10 py-4 pl-10 focus:outline-none transition-colors font-medium text-white placeholder:text-white/20 focus:border-emerald-500",
                    className
                )}
                {...props}
            />
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 transition-all duration-500 group-focus-within:w-full" />
        </div>
    )
}

// --- 2. LOGIC (SIRF LOGIC FIX KIYA HAI) ---

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function PartnerLoginPage() {
  const router = useRouter();
  const { auth, db } = useFirebase();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false);
  const [inputType, setInputType] = useState<'phone' | 'partnerId' | 'none'>('none');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const cleanId = identifier.replace(/\s/g, '');
    if (/^\d{1,10}$/.test(cleanId)) setInputType('phone');
    else if (cleanId.length > 3) setInputType('partnerId');
    else setInputType('none');
  }, [identifier]);

  // 🔥 FIXED DATABASE CHECK
  const findAndSetSession = async (firebaseUser?: FirebaseUser) => {
    if (!db || !firebaseUser?.uid) return;

    try {
        const partnerRef = doc(db, 'pathPartners', firebaseUser.uid);
        const partnerDoc = await getDoc(partnerRef);

        if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            const sessionData = { 
                role: 'driver', 
                ...partnerData,
                id: partnerDoc.id // ✅ CRITICAL FIX: Use the document ID as the primary identifier
            };

            localStorage.setItem('curocity-session', JSON.stringify(sessionData));
            toast.success(`Welcome back, ${partnerData.name}!`);
            router.push('/driver');
        } else {
            toast.info("Profile not found. Let's create one!");
            router.push('/driver/onboarding');
        }
    } catch (error) {
        console.error("Access Denied Error:", error);
        toast.error('Access Denied');
    }
  }

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanIdentifier = identifier.replace(/\s/g, '');
    if(inputType === 'phone') {
        if (!auth || !recaptchaContainerRef.current) return;
        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible' });
            }
            const result = await signInWithPhoneNumber(auth, `+91${cleanIdentifier}`, window.recaptchaVerifier);
            setConfirmationResult(result);
            setStep('otp');
            toast.success('OTP Sent');
        } catch (err) { 
            console.error("SMS Failed:", err);
            toast.error('SMS Failed. Please check the number or try again later.'); 
        }
    }
    setIsLoading(false);
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!confirmationResult || !otp) { setIsLoading(false); return; }
    try {
        const result = await confirmationResult.confirm(otp);
        await findAndSetSession(result.user);
    } catch (error: any) {
        console.error("OTP Error:", error);
        toast.error('Invalid OTP');
    } finally {
        setIsLoading(false);
    }
  }
  
  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center overflow-y-auto bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
      
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      <NoiseOverlay />

      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] opacity-40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      </div>

      {/* --- LOGIN CARD (TERA ORIGINAL UI) --- */}
      <div className="w-full max-w-md px-6 relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-white/50 hover:text-white transition-colors group font-medium uppercase tracking-wider text-xs">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
        </Link>

        <SpotlightCard className="p-8 md:p-12">
            
            <div className="text-center mb-10 flex flex-col items-center">
                <BrandLogo size="lg" withText={false} />
                <h1 className="text-3xl font-black tracking-tighter text-white mb-2 mt-4 uppercase">
                    PARTNER PORTAL
                </h1>
                <p className="text-sm text-white/50">
                    {step === 'otp' ? `Enter code sent to +91 ${identifier}` : 'Manage your business & earnings.'}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'login' ? (
                    <motion.form 
                        key="login" 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
                        onSubmit={handlePartnerLogin}
                    >
                        <CreativeInput 
                            icon={Phone} 
                            placeholder="Phone Number" 
                            value={identifier} 
                            onChange={(e: any) => setIdentifier(e.target.value)} 
                            disabled={isLoading} 
                            autoFocus
                        />
                        
                        <button 
                            type="submit" 
                            disabled={isLoading || identifier.length < 3} 
                            onMouseEnter={() => setIsHovered(true)} 
                            onMouseLeave={() => setIsHovered(false)} 
                            className="w-full h-14 rounded-full font-bold mt-8 flex items-center justify-center gap-3 transition-all relative overflow-hidden shadow-xl shadow-emerald-900/20 bg-white text-black hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="relative z-10 tracking-wide">
                                {isLoading ? <Loader2 className="animate-spin" /> : 'SEND OTP'}
                            </span>
                            {!isLoading && <ArrowRight size={18} className={`relative z-10 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form 
                        key="otp" 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
                        onSubmit={handleOtpSubmit}
                    >
                        <div className="text-center mb-8">
                            <input 
                                type="tel" 
                                maxLength={6} 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)} 
                                className="w-full bg-transparent border-b-2 border-white/10 text-center text-5xl font-mono tracking-[0.5em] py-4 focus:outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-white/10" 
                                autoFocus 
                                placeholder="000000"
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full h-14 rounded-full font-bold mt-4 transition-all shadow-lg bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-[1.02]">
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY & LOGIN'}
                        </button>
                        <button type="button" onClick={() => setStep('login')} className="w-full mt-6 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                            Change Number
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {step === 'login' && (
                <div className="mt-10 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-white/40">
                        New here?{' '}
                        <Link href="/driver/onboarding" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all">
                            Apply to become a Partner
                        </Link>
                    </p>
                </div>
            )}

        </SpotlightCard>
      </div>
    </div>
  );
}
