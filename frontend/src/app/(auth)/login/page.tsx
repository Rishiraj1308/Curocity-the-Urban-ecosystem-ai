
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  motion, 
  AnimatePresence, 
  useMotionTemplate, 
  useMotionValue 
} from 'framer-motion'
import { 
  Loader2, ArrowRight, Mail, Lock, Phone, User, Calendar, Chrome, ArrowLeft, Sun, Moon
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ✅ FIREBASE IMPORTS UPDATED
import { useFirebase } from '@/lib/firebase/client-provider'
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile, // 🔥 ADDED
  type User as FirebaseUser,
  type ConfirmationResult 
} from 'firebase/auth'

// --- 1. VISUAL COMPONENTS ---

const NoiseOverlay = () => (
    <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.03] mix-blend-overlay">
        <svg className="w-full h-full">
            <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    </div>
)

// --- IMPROVED CARD (BETTER CONTRAST) ---
const SpotlightCard = ({ children, isDark, className = "" }: { children: React.ReactNode, isDark: boolean, className?: string }) => {
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
                "relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-md",
                // LIGHT MODE: Pure white card with heavy shadow to pop against background
                !isDark && "bg-white/90 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
                // DARK MODE: Dark grey glass with white border to define edges
                isDark && "bg-neutral-900/60 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                className
            )}
        >
            {/* Spotlight Glow */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: useMotionTemplate`radial-gradient(600px circle at ${position.x}px ${position.y}px, ${isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0, 0, 0, 0.05)'}, transparent 40%)`,
                }}
            />
            <div className="relative h-full z-10">
                {children}
            </div>
        </div>
    );
};

// INPUT FIELD
interface CreativeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: any;
    isDark: boolean;
}

const CreativeInput = ({ icon: Icon, isDark, className, ...props }: CreativeInputProps) => {
    return (
        <div className="relative group mb-4">
            <Icon 
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 transition-colors size-5",
                    isDark ? "text-white/40 group-focus-within:text-cyan-400" : "text-neutral-400 group-focus-within:text-black"
                )} 
            />
            <input 
                className={cn(
                    "w-full bg-transparent border-b py-4 pl-8 focus:outline-none transition-colors font-medium",
                    isDark 
                        ? "text-white border-white/10 placeholder:text-white/20 focus:border-cyan-500" 
                        : "text-neutral-900 border-neutral-300 placeholder:text-neutral-400 focus:border-black",
                    className
                )}
                {...props}
            />
            <div className={cn(
                "absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-500 group-focus-within:w-full",
                isDark ? "bg-cyan-500" : "bg-black"
            )} />
        </div>
    )
}

// --- 2. MAIN LOGIC ---

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { auth, db } = useFirebase();
  const roleFromQuery = searchParams.get('role') || 'user'
  
  const [step, setStep] = useState<'login' | 'details' | 'otp'>('login');
  const [identifier, setIdentifier] = useState(searchParams.get('phone') || '');
  const [inputType, setInputType] = useState<'email' | 'phone' | 'none'>('none');
  
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(true); 
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (identifier.includes('@')) {
      setInputType('email');
    } else if (/^\d{1,10}$/.test(identifier)) {
      setInputType('phone');
    } else {
      setInputType('none');
    }
  }, [identifier]);

  // --- AUTH HANDLERS ---
  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId, adminPassword }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
            toast.success("Login Successful");
            localStorage.setItem('curocity-admin-session', JSON.stringify(data.session));
            window.location.href = '/admin'; 
        } else {
             toast.error(data.message || "Invalid credentials.");
        }
      } catch (error) {
        toast.error("Login Error");
      } finally {
        setIsLoading(false);
      }
  }

  // ✅ UPDATED LOGIN LOGIC
  const findAndSetSession = async (user: FirebaseUser) => {
    if (!db || !auth) return false;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 🔥 FIX: Update auth profile with name from database
        if (userData.name && user.displayName !== userData.name) {
            await updateProfile(user, { displayName: userData.name });
        }

        const sessionData = { role: 'user', phone: userData.phone, email: userData.email, name: userData.name, userId: user.uid, gender: userData.gender };
        localStorage.setItem('curocity-session', JSON.stringify(sessionData));
        toast.success("Login Successful");
        router.push('/user');
        return true;
    }
    
    // If user exists in Auth but not DB, go to details page
    if (user.displayName) setName(user.displayName);
    if (user.email) setIdentifier(user.email);
    if (user.phoneNumber) setIdentifier(user.phoneNumber.replace('+91', ''));
    setStep('details'); 
    return true; 
  }

  const handleIdentifierSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (inputType === 'email') await handleEmailSubmit();
    else if (inputType === 'phone') await handlePhoneSubmit();
    setIsLoading(false);
  }

  const handleEmailSubmit = async () => {
    if (!auth || !db) return;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      await findAndSetSession(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') setStep('details');
      else if (error.code === 'auth/wrong-password') toast.error('Incorrect Password');
      else toast.error(error.message);
    }
  }

  const handlePhoneSubmit = async () => {
    if (!auth || !identifier || !recaptchaContainerRef.current) return;
    try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible' });
        const fullPhoneNumber = `+91${identifier}`;
        const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
        setConfirmationResult(confirmation);
        setStep('otp');
        toast.success('OTP Sent!');
    } catch (error: any) {
        toast.error('Failed to Send OTP');
    }
  }
  
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      if (!confirmationResult || !otp) { setIsLoading(false); return };
      try {
          const result = await confirmationResult.confirm(otp);
          await findAndSetSession(result.user);
      } catch (error: any) {
          toast.error('Invalid OTP');
      } finally {
          setIsLoading(false);
      }
  }

  const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name || !gender || !dob || (inputType === 'email' && !password)) {
          toast.error("Incomplete Form"); return;
      }
      if (!db || !auth) return;
      setIsLoading(true);
      try {
          let user = auth.currentUser;
          if (!user && inputType === 'email') {
              user = (await createUserWithEmailAndPassword(auth, identifier, password)).user;
          }
          if (!user) throw new Error("Authentication failed.");
          
          // 🔥 FIX: Update profile displayName on creation
          await updateProfile(user, { displayName: name });

          const newUserRef = doc(db, "users", user.uid);
          const dataToSave = {
              id: user.uid, name, email: user.email || (inputType === 'email' ? identifier : null),
              phone: user.phoneNumber ? user.phoneNumber.replace('+91','') : (inputType === 'phone' ? identifier : null),
              gender, dob, role: 'user', createdAt: serverTimestamp(), isOnline: false,
          };
          await setDoc(newUserRef, dataToSave);
          localStorage.setItem('curocity-session', JSON.stringify({ role: 'user', ...dataToSave, userId: user.uid }));
          toast.success("Account Created!");
          router.push('/user');
      } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') { toast.error('Email in use'); setStep('login'); }
          else toast.error('Registration Failed');
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await findAndSetSession(result.user);
    } catch (error: any) {
        toast.error('Google Sign-In Failed');
    } finally {
        setIsLoading(false);
    }
  }

  if (!isMounted) return null;

  return (
    <div className={cn(
        "fixed inset-0 w-full h-full flex items-center justify-center overflow-y-auto selection:bg-cyan-500 selection:text-black transition-colors duration-500",
        // Light Mode: Light Gray background to make White Card Pop
        isDarkMode ? "bg-black text-white" : "bg-neutral-100 text-neutral-900"
    )}>
      
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      <NoiseOverlay />

      {/* THEME TOGGLE */}
      <div className="absolute top-6 right-6 z-50">
        <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={cn(
                "w-10 h-10 flex items-center justify-center rounded-full border backdrop-blur transition-all shadow-sm",
                isDarkMode ? "border-white/20 bg-white/10 hover:bg-white/20 text-white" : "border-neutral-300 bg-white/50 hover:bg-white text-neutral-900"
            )}
        >
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </div>

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Image with fallback */}
          <img 
              src="https://images.unsplash.com/photo-1495527870239-c2c349e44950?q=80&w=2070" 
              alt="bg" 
              className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-500", isDarkMode ? "opacity-40" : "opacity-10 grayscale")}
              onError={(e) => e.currentTarget.style.display = 'none'}
          />
          
          <video 
              autoPlay loop muted playsInline 
              className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                  // Light mode: Just standard opacity, no weird blend modes that turn things grey
                  isDarkMode ? "opacity-30 mix-blend-screen" : "opacity-10"
              )}
              src="https://cdn.coverr.co/videos/coverr-driving-through-the-city-at-night-4304/1080p.mp4" 
          />
          
          {/* Gradient Overlay - IMPROVED */}
          <div className={cn(
              "absolute inset-0 bg-gradient-to-t transition-colors duration-500",
              // Light Mode: White fade from bottom to keep top visible
              isDarkMode ? "from-black via-black/50 to-black/80" : "from-white/80 via-white/40 to-transparent"
          )} />
      </div>

      {/* CONTENT WRAPPER */}
      <div className="w-full max-w-md px-6 relative z-10 my-auto py-10">
        
        <Link href="/" className={cn("inline-flex items-center gap-2 mb-8 transition-colors group font-medium uppercase tracking-wider text-xs", isDarkMode ? "text-white/50 hover:text-white" : "text-neutral-500 hover:text-black")}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to City</span>
        </Link>

        <SpotlightCard isDark={isDarkMode} className="p-8 md:p-10">
            
            <div className="text-center mb-8">
                <h1 className={cn("text-3xl md:text-4xl font-black tracking-tighter mb-2", isDarkMode ? "text-white" : "text-black")}>
                    {roleFromQuery === 'admin' ? 'ADMIN.' : 'CURO.'}
                </h1>
                <p className={cn("text-sm", isDarkMode ? "text-white/50" : "text-neutral-500")}>
                    {step === 'otp' ? `Code sent to +91 ${identifier}` : 
                     step === 'details' ? 'Complete your profile.' : 
                     'Enter the ecosystem.'}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {roleFromQuery === 'admin' ? (
                    <motion.form key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleAdminLogin}>
                        <CreativeInput isDark={isDarkMode} icon={Mail} placeholder="admin@curocity.com" value={adminId} onChange={(e: any) => setAdminId(e.target.value)} disabled={isLoading} />
                        <CreativeInput isDark={isDarkMode} icon={Lock} type="password" placeholder="Access Key" value={adminPassword} onChange={(e: any) => setAdminPassword(e.target.value)} disabled={isLoading} />
                        <button type="submit" disabled={isLoading} className={cn("w-full h-12 rounded-full font-bold mt-4 flex items-center justify-center gap-2 transition-colors shadow-lg", isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-neutral-800")}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'ACCESS PANEL'}
                        </button>
                    </motion.form>
                ) : step === 'login' ? (
                    <motion.form key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleIdentifierSubmit}>
                        <CreativeInput isDark={isDarkMode} icon={inputType === 'phone' ? Phone : Mail} placeholder="Phone or Email" value={identifier} onChange={(e: any) => {
                                const val = e.target.value;
                                if(/^\d*$/.test(val) && val.length <= 10) setIdentifier(val);
                                else if (val.includes('@') || /[a-zA-Z]/.test(val)) setIdentifier(val);
                            }} disabled={isLoading} />
                        {inputType === 'email' && (
                            <CreativeInput isDark={isDarkMode} icon={Lock} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} disabled={isLoading} />
                        )}
                        <button type="submit" disabled={isLoading || identifier.length < 3} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} className={cn("w-full h-12 rounded-full font-bold mt-6 flex items-center justify-center gap-2 transition-colors relative overflow-hidden shadow-lg", isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-neutral-800")}>
                            <span className="relative z-10">{isLoading ? <Loader2 className="animate-spin" /> : (inputType === 'phone' ? 'SEND CODE' : 'CONTINUE')}</span>
                            {!isLoading && <ArrowRight size={18} className={`relative z-10 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />}
                        </button>
                        <div className="flex items-center gap-4 my-6">
                            <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/10" : "bg-neutral-200")} />
                            <span className={cn("text-xs font-mono uppercase", isDarkMode ? "text-white/30" : "text-neutral-400")}>OR</span>
                            <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/10" : "bg-neutral-200")} />
                        </div>
                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={cn("w-full h-12 rounded-full border flex items-center justify-center gap-3 transition-all group font-medium", isDarkMode ? "border-white/20 bg-white/5 hover:bg-white/10 text-white" : "border-neutral-200 bg-transparent hover:bg-neutral-50 text-neutral-700")}>
                            <Chrome size={20} className={cn("group-hover:scale-110 transition-transform", isDarkMode ? "text-white" : "text-black")} />
                            <span className="text-sm">Google Account</span>
                        </button>
                    </motion.form>
                ) : step === 'otp' ? (
                    <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleOtpSubmit}>
                        <div className="text-center mb-6">
                            <input type="tel" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className={cn("w-full bg-transparent border-b-2 text-center text-4xl font-mono tracking-[0.5em] py-4 focus:outline-none transition-colors", isDarkMode ? "border-white/20 text-white focus:border-cyan-500" : "border-neutral-300 text-black focus:border-black")} autoFocus />
                        </div>
                        <button type="submit" disabled={isLoading} className={cn("w-full h-12 rounded-full font-bold mt-4 transition-colors shadow-lg", isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-neutral-800")}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY'}
                        </button>
                        <button type="button" onClick={() => setStep('login')} className={cn("w-full mt-4 text-xs hover:underline", isDarkMode ? "text-white/50 hover:text-white" : "text-neutral-500 hover:text-black")}>Change Number</button>
                    </motion.form>
                ) : (
                    <motion.form key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleDetailsSubmit} className="space-y-2">
                        <CreativeInput isDark={isDarkMode} icon={User} placeholder="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
                        {inputType === 'email' && !auth?.currentUser && (
                             <CreativeInput isDark={isDarkMode} icon={Lock} type="password" placeholder="Create Password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                        )}
                        <CreativeInput isDark={isDarkMode} icon={Calendar} type="date" placeholder="Date of Birth" value={dob} onChange={(e: any) => setDob(e.target.value)} />
                        <div className="flex gap-4 my-4 justify-center">
                            {['male', 'female', 'other'].map((g) => (
                                <label key={g} className={cn("cursor-pointer px-4 py-2 rounded-full border text-xs uppercase tracking-widest transition-all", 
                                    gender === g 
                                        ? (isDarkMode ? "bg-cyan-500 border-cyan-500 text-black font-bold" : "bg-black border-black text-white font-bold")
                                        : (isDarkMode ? "border-white/20 text-white/50 hover:border-white/50" : "border-neutral-300 text-neutral-500 hover:border-neutral-500")
                                )}>
                                    <input type="radio" name="gender" value={g} checked={gender === g} onChange={(e) => setGender(e.target.value)} className="hidden" />
                                    {g}
                                </label>
                            ))}
                        </div>
                        <button type="submit" disabled={isLoading} className={cn("w-full h-12 rounded-full font-bold mt-6 transition-colors shadow-lg", isDarkMode ? "bg-white text-black hover:bg-cyan-400" : "bg-black text-white hover:bg-neutral-800")}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'FINISH SETUP'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="mt-8 text-center space-y-2">
                {roleFromQuery === 'user' && (
                    <p className={cn("text-xs", isDarkMode ? "text-white/40" : "text-neutral-500")}>
                        Want to earn?{' '}
                        <Link href="/partner-hub" className={cn("transition-colors border-b pb-0.5", isDarkMode ? "text-cyan-400 hover:text-cyan-300 border-cyan-400/30" : "text-blue-600 hover:text-blue-800 border-blue-600/30")}>
                            Become a Partner
                        </Link>
                    </p>
                )}
                {roleFromQuery !== 'admin' && (
                    <Link href="/login?role=admin" onClick={() => setStep('login')} className={cn("block text-[10px] uppercase tracking-widest mt-4", isDarkMode ? "text-white/20 hover:text-white" : "text-black/20 hover:text-black")}>
                        Admin Access
                    </Link>
                )}
            </div>

        </SpotlightCard>
      </div>
    </div>
  );
}
