'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import emailjs from '@emailjs/browser'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, User, Calendar, Phone, CheckSquare, Square, ArrowRight, Sun, Moon, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ✅ FIREBASE IMPORTS
import { useFirebase } from '@/lib/firebase/client-provider'
import { setDoc, doc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,     
  onAuthStateChanged
} from 'firebase/auth'

// ---------------- CONFIG ----------------
const EMAILJS_SERVICE_ID = "service_ncyejsj";      
const EMAILJS_TEMPLATE_ID = "template_za97107";    
const EMAILJS_PUBLIC_KEY = "3YzxeXnnP9zraknVb"; 
// ----------------------------------------

// 🔥 UI: DEEP BACKGROUND (Fixed Scrolling)
const DeepBackground = ({ isDark }: { isDark: boolean }) => (
    <div className={cn("fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700", isDark ? "bg-[#050505]" : "bg-[#f2f4f7]")}>
        <div className={cn("absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[180px] opacity-20", isDark ? "bg-blue-900" : "bg-blue-200")} />
        <div className={cn("absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-20", isDark ? "bg-purple-900" : "bg-purple-200")} />
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
)

// 🔥 UI: CURVED GLASS INPUT
const CurvedInput = ({ icon: Icon, isDark, className, ...props }: any) => {
    return (
        <div className="relative group mb-4">
            <div className={cn("absolute left-5 top-1/2 -translate-y-1/2 transition-colors z-10", 
                isDark ? "text-white/40 group-focus-within:text-white" : "text-black/40 group-focus-within:text-black"
            )}>
                <Icon size={18} />
            </div>
            <input 
                className={cn("w-full py-4 pl-14 pr-6 rounded-3xl text-sm font-medium outline-none transition-all border", 
                    isDark 
                        ? "bg-white/5 border-white/5 text-white placeholder:text-white/20 focus:bg-white/10 focus:border-white/20 focus:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                        : "bg-white border-transparent text-black placeholder:text-black/30 focus:border-black/10 focus:shadow-lg disabled:bg-gray-100 disabled:opacity-70",
                    className
                )} 
                {...props} 
            />
        </div>
    )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { auth, db } = useFirebase();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null); 
  
  const roleFromQuery = searchParams.get('role') === 'admin' ? 'admin' : 'user';
  const [step, setStep] = useState<'login' | 'details' | 'otp'>('login');
  const [identifier, setIdentifier] = useState(searchParams.get('email') || '');
  const [inputType, setInputType] = useState<'email' | 'phone' | 'none'>('none');

  // DETAILS STATE
  const [detailsEmail, setDetailsEmail] = useState('');
  const [detailsPhone, setDetailsPhone] = useState('');

  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [timer, setTimer] = useState(0); 
  
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); 

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) interval = setInterval(() => { setTimer((prev) => prev - 1); }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === 'login') {
      if (identifier.includes('@')) setInputType('email');
      else if (/^\d{1,10}$/.test(identifier)) setInputType('phone');
      else setInputType('none');
    }
  }, [identifier, step]);

  // 🔥 LISTENER: Auto-fill Email from Auth
  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const email = user.email || user.providerData?.[0]?.email;
                if (email) {
                    setDetailsEmail(email);
                    if(step === 'details') setInputType('email');
                }
            }
        });
        return () => unsubscribe();
    }
  }, [auth, step]);

  // --- GATEKEEPER ---
  const checkAndDirectUser = (userData: any, email: string, phone: string, userName: string) => {
      const finalEmail = email || userData.email || auth?.currentUser?.email || "";
      const finalPhone = phone || userData.phone || "";

      const isProfileComplete = 
          userData.gender && 
          userData.dob && 
          userData.name && 
          (finalEmail !== "") &&
          (finalPhone !== "");

      if (isProfileComplete) {
          const sessionData = { 
            role: 'user', 
            phone: finalPhone,
            email: finalEmail,
            name: userData.name, 
            userId: userData.id, 
            gender: userData.gender 
          };
          localStorage.setItem('curocity-session', JSON.stringify(sessionData));
          toast.success("Welcome back!");
          router.push('/user');
      } else {
          setDetailsEmail(finalEmail);
          setDetailsPhone(finalPhone);
          setName(userData.name || userName || "");
          if (userData.gender) setGender(userData.gender);
          if (userData.dob) setDob(userData.dob);

          toast.info("Please complete your registration.");
          setStep('details');
      }
  }

  // --- GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('email'); 
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const email = user.email || user.providerData?.[0]?.email || "";

        if (db) {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                checkAndDirectUser(querySnapshot.docs[0].data(), email, "", user.displayName || "");
            } else {
                setDetailsEmail(email); 
                setInputType('email');
                setName(user.displayName || "");
                toast.success("Verified! Step 2: Complete Details.");
                setStep('details'); 
            }
        }
    } catch (error: any) {
        console.error(error);
        toast.error("Google Sign-In Failed");
    } finally {
        setIsLoading(false);
    }
  }

  // --- SEND CODE ---
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timer > 0) return; 
    setIsLoading(true);

    if (inputType === 'phone') {
        if (!auth || !recaptchaContainerRef.current) return;
        try {
            if (!(window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: 'invisible' });
            }
            const fullPhoneNumber = `+91${identifier}`; 
            const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, (window as any).recaptchaVerifier);
            setConfirmationResult(confirmation);
            toast.success("SMS sent to " + fullPhoneNumber);
            setStep('otp');
            setTimer(60); 
        } catch (error: any) {
            toast.error(error.message || "Failed to send SMS");
        }
    } else if (inputType === 'email') {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        const templateParams = { user_email: identifier, otp: code, user_name: "Future User" };
        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
            toast.success("OTP sent to " + identifier);
            setStep('otp');
            setTimer(60); 
        } catch (error) {
            toast.error("Failed to send Email. Check Keys.");
        }
    } else {
        toast.error("Invalid Email or Phone Number");
    }
    setIsLoading(false);
  }

  // --- VERIFY CODE ---
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let isVerified = false;

    if (inputType === 'phone') {
        if (!confirmationResult) return;
        try {
            await confirmationResult.confirm(otp);
            isVerified = true;
        } catch (error) {
            toast.error("Invalid SMS Code");
            setIsLoading(false);
            return;
        }
    } else {
        if (otp === generatedOtp) isVerified = true;
        else { toast.error("Wrong Email OTP"); setIsLoading(false); return; }
    }

    if (isVerified) {
        try {
            if (!db) return;
            const field = inputType === 'email' ? 'email' : 'phone';
            const q = query(collection(db, "users"), where(field, "==", identifier));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingData = querySnapshot.docs[0].data();
                checkAndDirectUser(
                    existingData, 
                    existingData.email || (inputType === 'email' ? identifier : ""),
                    existingData.phone || (inputType === 'phone' ? identifier : ""),
                    ""
                );
            } else {
                if (inputType === 'email') {
                    setDetailsEmail(identifier);
                    setDetailsPhone("");
                } else {
                    setDetailsPhone(identifier);
                    setDetailsEmail("");
                }
                toast.success("Verified! Step 2: Complete Details.");
                setStep('details');
            }
        } catch (error) {
            toast.error("Database Error");
        }
    }
    setIsLoading(false);
  }

  // --- REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalEmail = detailsEmail;
      if (!finalEmail || finalEmail.trim() === "") {
          if (auth?.currentUser?.email) finalEmail = auth.currentUser.email;
      }
      let finalPhone = detailsPhone;

      if (!name || !gender || !dob || !finalPhone || !finalEmail) {
          toast.error("Please fill all details including Email."); 
          return;
      }
      if (!agreedToTerms) {
          toast.error("Please agree to Terms & Conditions");
          return;
      }

      setIsLoading(true);
      
      try {
          const currentUser = auth?.currentUser;
          const newId = currentUser?.uid || 'user_' + Math.random().toString(36).substr(2, 9);
          
          const newUser = {
              id: newId,
              name,
              email: finalEmail,
              phone: finalPhone,
              gender,
              dob,
              referralCode: referralCode || null,
              role: 'user',
              createdAt: serverTimestamp(),
              isOnline: true
          };

          if(db) {
              await setDoc(doc(db, "users", newId), newUser, { merge: true });

              if ((otp === "" || inputType === 'phone') && finalEmail && finalEmail.includes('@')) {
                  const templateParams = {
                      user_email: finalEmail,
                      user_name: name,
                      otp: "SUCCESS", 
                  };
                  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
                    .catch((err) => console.log("Email error:", err));
              }

              const sessionData = { 
                role: 'user', 
                phone: finalPhone,
                email: finalEmail,
                name: name, 
                userId: newId, 
                gender: gender 
              };
              localStorage.setItem('curocity-session', JSON.stringify(sessionData));
              toast.success("Welcome to Curocity!");
              router.push('/user');
          }
      } catch (error) {
          console.error("DB Error:", error);
          toast.error("Registration Failed. Try Again.");
      } finally {
          setIsLoading(false);
      }
  };

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

  if (!isMounted) return null;

  return (
    // 🔥 FIX 1: Layout Changed from 'fixed' to 'min-h-screen' to allow scrolling on small screens/keyboards
    <div className={cn("min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700", isDarkMode ? "bg-[#050505] text-white" : "bg-[#f2f4f7] text-neutral-900")}>
      
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      
      <DeepBackground isDark={isDarkMode} />

      <div className="absolute top-6 right-6 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border transition-all hover:scale-110 shadow-lg", isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-black/5 bg-white text-black")}>
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 py-10">
        <Link href="/" className={cn("inline-flex items-center gap-2 mb-8 transition-all group font-medium text-xs tracking-wider opacity-60 hover:opacity-100", isDarkMode ? "text-white" : "text-black")}>
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to City</span>
        </Link>

        {/* 🔥 CURVED GLASS CARD */}
        <div className={cn("relative rounded-[3rem] overflow-hidden backdrop-blur-2xl border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-8 md:p-12 transition-all duration-500", 
            isDarkMode ? "bg-white/5 border-white/10" : "bg-white/70 border-white/50"
        )}>
            
            <div className="text-center mb-10">
                <motion.h1 
                    animate={{ 
                        filter: isDarkMode ? ["brightness(1)", "brightness(1.2)", "brightness(1)"] : ["brightness(1)", "brightness(0.8)", "brightness(1)"],
                        scale: [1, 1.01, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("text-5xl font-black tracking-tighter mb-3", isDarkMode ? "text-white" : "text-neutral-900")}
                >
                    {roleFromQuery === 'admin' ? 'ADMIN.' : 'CUROCITY.'}
                </motion.h1>
                <p className={cn("text-sm font-medium tracking-wide", isDarkMode ? "text-white/40" : "text-neutral-500")}>
                    {step === 'otp' ? `Code sent to ${identifier}` : step === 'details' ? 'One last step.' : 'Enter the ecosystem.'}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {roleFromQuery === 'admin' ? (
                    <motion.form key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleAdminLogin}>
                        <CurvedInput isDark={isDarkMode} icon={Mail} placeholder="admin@curocity.com" value={adminId} onChange={(e: any) => setAdminId(e.target.value)} disabled={isLoading} />
                        <CurvedInput isDark={isDarkMode} icon={Lock} type="password" placeholder="Access Key" value={adminPassword} onChange={(e: any) => setAdminPassword(e.target.value)} disabled={isLoading} />
                        <button type="submit" disabled={isLoading} className={cn("w-full h-14 rounded-full font-bold mt-4 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]", isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'ACCESS PANEL'}
                        </button>
                    </motion.form>
                ) : step === 'login' ? (
                    <motion.form key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleSendCode}>
                        <CurvedInput isDark={isDarkMode} icon={inputType === 'phone' ? Phone : Mail} placeholder="Email or Phone" value={identifier} onChange={(e: any) => setIdentifier(e.target.value)} disabled={isLoading} />
                        
                        <button type="submit" disabled={isLoading || identifier.length < 3} className={cn("w-full h-14 rounded-full font-bold mt-4 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]", isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")}>
                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>SEND CODE</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-4 my-8">
                            <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/10" : "bg-black/10")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDarkMode ? "text-white/30" : "text-black/30")}>OR</span>
                            <div className={cn("h-[1px] flex-1", isDarkMode ? "bg-white/10" : "bg-black/10")} />
                        </div>

                        <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className={cn("w-full h-14 rounded-full border flex items-center justify-center gap-3 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98]", isDarkMode ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" : "border-black/10 bg-white/50 hover:bg-white/80 text-black")}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            <span className="text-sm">Continue with Google</span>
                        </button>
                    </motion.form>
                ) : step === 'otp' ? (
                    <motion.form key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleVerifyCode}>
                        <div className="text-center mb-8">
                            <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className={cn("w-full bg-transparent border-b-2 text-center text-5xl font-mono tracking-[0.5em] py-4 focus:outline-none transition-colors", isDarkMode ? "border-white/20 text-white focus:border-white" : "border-black/20 text-black focus:border-black")} autoFocus placeholder="000000" />
                        </div>
                        <button type="submit" disabled={isLoading} className={cn("w-full h-14 rounded-full font-bold mt-4 transition-all shadow-lg active:scale-[0.98]", isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY & LOGIN'}
                        </button>
                        
                        <div className="text-center mt-6">
                            {timer > 0 ? (
                                <p className={cn("text-xs font-medium", isDarkMode ? "text-white/40" : "text-black/40")}>Resend code in <span className="font-mono">{timer}s</span></p>
                            ) : (
                                <button type="button" onClick={handleSendCode} className={cn("text-xs font-bold hover:underline uppercase tracking-wide", isDarkMode ? "text-white" : "text-black")}>Resend Code</button>
                            )}
                        </div>
                        
                        <button type="button" onClick={() => setStep('login')} className={cn("w-full mt-4 text-[10px] hover:underline opacity-50 hover:opacity-100 transition-opacity", isDarkMode ? "text-white" : "text-black")}>Changed your mind?</button>
                    </motion.form>
                ) : (
                    // --- STEP 3: DETAILS ---
                    <motion.form key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleRegister}>
                        <CurvedInput isDark={isDarkMode} icon={User} placeholder="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
                        
                        {/* 🔥 FIX 2: Correct disabled logic - Only disable if it's from Auth (Google), otherwise Editable */}
                        <CurvedInput 
                            isDark={isDarkMode} 
                            icon={Mail} 
                            placeholder="Email Address" 
                            value={detailsEmail || auth?.currentUser?.email || ""} 
                            disabled={!!auth?.currentUser?.email} // ONLY DISABLE IF FROM GOOGLE
                            onChange={(e: any) => setDetailsEmail(e.target.value)} 
                        />

                        <CurvedInput 
                            isDark={isDarkMode} 
                            icon={Phone} 
                            placeholder="Mobile Number" 
                            value={detailsPhone} 
                            disabled={inputType === 'phone' && detailsPhone !== ''} 
                            onChange={(e: any) => setDetailsPhone(e.target.value)} 
                        />

                        <div className="flex gap-3 mb-4">
                            <CurvedInput className="mb-0" isDark={isDarkMode} icon={Calendar} type="date" placeholder="DOB" value={dob} onChange={(e: any) => setDob(e.target.value)} />
                            <CurvedInput className="mb-0" isDark={isDarkMode} icon={User} placeholder="Referral Code" value={referralCode} onChange={(e: any) => setReferralCode(e.target.value)} />
                        </div>

                        <div className="flex gap-3 mb-6">
                            {['Male', 'Female', 'Other'].map((g) => (
                                <button type="button" key={g} onClick={() => setGender(g.toLowerCase())} className={cn("flex-1 py-4 rounded-3xl text-xs font-bold uppercase border transition-all backdrop-blur-md", gender === g.toLowerCase() ? (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black") : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10" : "bg-white/40 border-white/40 text-black/60 hover:bg-white/60"))}>
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div onClick={() => setAgreedToTerms(!agreedToTerms)} className="flex items-center gap-3 cursor-pointer mb-6 justify-center">
                            <div className={cn("transition-colors", agreedToTerms ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/20" : "text-black/20"))}>
                                {agreedToTerms ? <CheckSquare size={20} /> : <Square size={20} />}
                            </div>
                            <p className={cn("text-xs select-none", isDarkMode ? "text-white/60" : "text-black/60")}>I agree to the <span className="underline font-bold">Terms</span>.</p>
                        </div>

                        <button type="submit" disabled={isLoading} className={cn("w-full h-14 rounded-full font-bold transition-all shadow-lg active:scale-[0.98]", isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")}>
                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'FINISH SETUP'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="mt-10 text-center">
                {roleFromQuery === 'user' && (
                    <p className={cn("text-xs font-medium tracking-wide", isDarkMode ? "text-white/30" : "text-black/40")}>
                        Want to earn?{' '} <Link href="/partner-hub" className={cn("border-b pb-0.5 hover:text-white transition-colors", isDarkMode ? "border-white/20" : "border-black/20 text-black")}>Become a Partner</Link>
                    </p>
                )}
                {roleFromQuery !== 'admin' && (
                    <Link href="/login?role=admin" onClick={() => setStep('login')} className={cn("block text-[10px] uppercase tracking-[0.2em] mt-4 opacity-20 hover:opacity-100 transition-opacity", isDarkMode ? "text-white" : "text-black")}>Admin Access</Link>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}