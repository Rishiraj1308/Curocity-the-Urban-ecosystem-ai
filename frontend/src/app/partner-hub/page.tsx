
'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  motion, 
  useMotionTemplate, 
  useMotionValue, 
  useScroll, 
  useTransform, 
  useSpring, 
  useVelocity, 
  useAnimationFrame 
} from 'framer-motion'
import { Car, Wrench, Ambulance, ArrowRight, ArrowLeft, Wallet, ShieldCheck, Clock, BarChart3, Sun, Moon, Stethoscope, Zap, Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import BrandLogo from '@/components/shared/brand-logo'
import { useTheme } from 'next-themes'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// --- UTILITIES ---
const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

// --- 1. VISUAL ASSETS ---

const NoiseOverlay = () => (
    <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.04] mix-blend-overlay">
        <svg className="w-full h-full">
            <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
    </div>
)

const VideoBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:hidden" />
        <div className="hidden dark:block absolute inset-0 w-full h-full">
            <img src="https://images.unsplash.com/photo-1495527870239-c2c349e44950?q=80&w=2070" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-40" onError={(e) => e.currentTarget.style.display = 'none'} />
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" src="https://cdn.coverr.co/videos/coverr-driving-through-the-city-at-night-4304/1080p.mp4" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
        </div>
    </div>
)

// --- 2. MARQUEE COMPONENT ---
function ParallaxText({ children, baseVelocity = 100 }: { children: string, baseVelocity: number }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);
  const directionFactor = useRef<number>(1);
  
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden m-0 whitespace-nowrap flex flex-nowrap select-none">
      <motion.div style={{ x }} className="font-black uppercase text-6w md:text-9xl flex whitespace-nowrap flex-nowrap text-black/80 dark:text-black">
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
      </motion.div>
    </div>
  );
}

// ✅ NEW: Rebuilt Testimonial Marquee with CSS Animation
const TestimonialMarquee = ({ children, duration = 60 }: { children: React.ReactNode, duration?: number }) => (
    <div className="w-full overflow-hidden">
        <div className="flex animate-marquee-slow" style={{ animationDuration: `${duration}s` }}>
            {children}
        </div>
    </div>
);

// --- 3. COMPONENTS ---

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null
    return (
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-10 h-10 text-foreground border border-border/40 hover:bg-muted transition-all">
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
}

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
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => opacity.set(1)}
            onMouseLeave={() => opacity.set(0)}
            className={cn("relative overflow-hidden rounded-3xl border border-border/50 bg-white/80 dark:bg-neutral-900/40 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md", className)}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{ opacity, background: useMotionTemplate`radial-gradient(600px circle at ${position.x}px ${position.y}px, var(--spotlight-color, rgba(16, 185, 129, 0.1)), transparent 40%)` }}
            />
            <div className="relative z-10 h-full">{children}</div>
        </motion.div>
    )
}

const PartnerOptionCard = ({ option, index }: { option: any, index: number }) => {
    const router = useRouter();
    return (
        <SpotlightCard className={cn("p-8 cursor-pointer group h-full flex flex-col", option.border)} >
            <div onClick={() => router.push(option.href)} className="h-full flex flex-col">
                <div className={cn("mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/20 text-foreground shadow-lg transition-colors duration-300", option.iconClass)}>
                    <option.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{option.title}</h3>
                <p className={cn("text-xs font-bold uppercase tracking-widest mb-4", option.text)}>{option.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">{option.description}</p>
                <div className="flex items-center text-sm font-bold uppercase tracking-wider text-foreground/70 group-hover:text-foreground transition-colors">
                    <span>{option.cta}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </SpotlightCard>
    )
}

// --- 4. CONTENT DATA ---

const partnerOptions = [
  { id: 'driver', icon: Car, title: "Path Partner", subtitle: "Drivers & Fleet", description: "Drive your own car or manage a fleet. 0% Commission. Daily payouts.", href: "/driver/onboarding", cta: "Start Driving", text: "text-cyan-600 dark:text-cyan-400", iconClass: "group-hover:bg-cyan-500/20 group-hover:text-cyan-600 dark:group-hover:text-cyan-400", border: "hover:border-cyan-500/30" },
  { id: 'mechanic', icon: Wrench, title: "ResQ Partner", subtitle: "Mechanics", description: "Get instant roadside assistance requests nearby. Grow your garage.", href: "/mechanic/onboarding", cta: "Join as Mechanic", text: "text-amber-600 dark:text-amber-400", iconClass: "group-hover:bg-amber-500/20 group-hover:text-amber-600 dark:group-hover:text-amber-400", border: "hover:border-amber-500/30" },
  { id: 'cure', icon: Stethoscope, title: "Cure Partner", subtitle: "Doctors & EMTs", description: "Join the emergency network. Save lives faster.", href: "/cure/onboarding", cta: "Join Network", text: "text-red-600 dark:text-red-400", iconClass: "group-hover:bg-red-500/20 group-hover:text-red-600 dark:group-hover:text-red-400", border: "hover:border-red-500/30" },
]

const features = [
    { title: "Zero Commission", desc: "You keep 100% of your ride fare. Only standard taxes apply.", icon: Wallet, color: "text-emerald-500" },
    { title: "Instant Payouts", desc: "Earnings hit your bank account daily. No weekly waiting.", icon: Zap, color: "text-yellow-500" },
    { title: "Partner Safety", desc: "24/7 support and insurance coverage for every trip.", icon: ShieldCheck, color: "text-blue-500" },
    { title: "Smart Growth", desc: "Analytics to help you identify high-demand areas.", icon: BarChart3, color: "text-purple-500" },
]

const steps = [
    { num: "01", title: "Register Online", desc: "Download the app or sign up here with your mobile number." },
    { num: "02", title: "Upload Documents", desc: "Submit digital copies of DL, RC, and Aadhaar for verification." },
    { num: "03", title: "Start Earning", desc: "Once verified, go online instantly. Accept requests and watch your earnings grow." },
]

const testimonials = [
    { name: "Vikram S.", role: "Driver", text: "Other apps took 30% of my hard work. Curocity takes 0%. My monthly income increased by ₹15,000." },
    { name: "Rajesh Auto", role: "Mechanic", text: "I sit at my shop and get breakdown requests on my phone. It's like magic for my business." },
    { name: "Dr. Anjali", role: "Doctor", text: "The emergency response time is incredible. Being part of this network actually saves lives." },
    { name: "Suresh P.", role: "Driver", text: "Daily payouts changed everything for my cash flow. Highly recommend Curocity!" },
]

const faqs = [
    { q: "Is there really 0% commission?", a: "We operate on a subscription model. You pay a small platform fee to use our tech, and every rupee of the fare is yours. Only standard GST applies." },
    { q: "How do I get paid?", a: "We offer instant settlements. You can withdraw your earnings to your bank account instantly, 24/7." },
    { q: "What documents are required?", a: "Driving License, Vehicle RC, Insurance, and Aadhaar Card. The entire verification process is digital and takes less than 24 hours." },
    { q: "Can I work with other apps simultaneously?", a: "Yes, you are your own boss. You are free to work with any platform." },
]


// --- 5. MAIN PAGE ---

export default function PartnerHubPage() {
  const router = useRouter()
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-background font-sans text-foreground selection:bg-emerald-500/30 selection:text-emerald-900 relative overflow-x-hidden transition-colors duration-500">
      <NoiseOverlay />
      <VideoBackground />

      {/* --- HEADER --- */}
      <header className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
         <div className="flex items-center gap-4">
             <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Home</span>
             </Link>
             <div className="h-4 w-[1px] bg-border" />
             <BrandLogo size="sm" withText={true} />
         </div>
         
         <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button onClick={() => router.push('/partner-login')} className="rounded-full font-bold px-6 h-10 bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                Login
            </Button>
         </div>
      </header>

      <main className="relative z-10">
         
         {/* --- HERO SECTION --- */}
         <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 -mt-20">
            <motion.div style={{ opacity, scale }} className="max-w-5xl mx-auto">
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/50 border border-border/50 backdrop-blur-md text-sm font-medium text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                    Founding Partners Program Live
                </div>

                <h1 className="text-[12vw] md:text-[13vw] font-black tracking-tighter text-foreground leading-[0.8] select-none drop-shadow-lg">
                    PARTNER
                </h1>

                <div className="flex items-center justify-center gap-6 mt-8 mb-12">
                    <div className="h-[2px] w-12 md:w-32 bg-foreground/30" />
                    <span className="text-sm md:text-2xl font-bold tracking-[0.5em] text-foreground uppercase">Build With Us</span>
                    <div className="h-[2px] w-12 md:w-32 bg-foreground/30" />
                </div>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                    Join the ecosystem that respects your work. Zero commissions, daily payouts, and complete transparency.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Button onClick={() => document.getElementById('join-section')?.scrollIntoView({ behavior: 'smooth' })} className="h-14 px-8 rounded-full text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
                        Join the Network
                    </Button>
                    <Button onClick={() => router.push('/partner-login')} variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-border/50 bg-background/50 backdrop-blur-md hover:bg-accent">
                        Partner Login
                    </Button>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute bottom-10 opacity-40"
            >
                <p className="text-[10px] uppercase tracking-widest mb-2 font-bold text-muted-foreground">Scroll to Explore</p>
                <div className="w-[2px] h-12 bg-gradient-to-b from-foreground to-transparent mx-auto rounded-full" />
            </motion.div>
         </section>

         {/* --- MARQUEE STRIP --- */}
         <section className="py-16 md:py-32 bg-emerald-500 text-black overflow-hidden -rotate-1 scale-105 border-y-8 border-black dark:border-black relative z-10">
              <ParallaxText baseVelocity={-2}>EARN • GROW • LEAD • EARN • GROW • LEAD •</ParallaxText>
         </section>
        
        {/* --- TESTIMONIALS MARQUEE --- */}
        <section className="py-24 border-t border-white/10 bg-[#080808] overflow-hidden">
            <div className="mb-16 text-center px-6">
                <h2 className="text-2xl font-bold text-gray-400">Trusted by Founding Partners</h2>
            </div>
            <TestimonialMarquee>
                {[...testimonials, ...testimonials].map((t, i) => (
                    <div key={i} className="w-[350px] md:w-[450px] p-8 mx-4 bg-white/5 border border-white/10 rounded-3xl flex-shrink-0">
                        <Star className="w-8 h-8 text-white/20 mb-4" />
                        <p className="text-lg text-gray-300 mb-6 leading-relaxed">"{t.text}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                            <div>
                                <p className="font-bold text-white">{t.name}</p>
                                <p className="text-xs text-gray-500 uppercase">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </TestimonialMarquee>
         </section>

         {/* --- FEATURES SECTION --- */}
         <section className="py-24 bg-background relative z-20">
             <div className="container mx-auto px-6">
                 <div className="text-center mb-16 max-w-2xl mx-auto">
                     <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-foreground">Why Partner with Curocity?</h2>
                     <p className="text-lg text-muted-foreground">Transparency is our core. No hidden charges, just honest business.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {features.map((feat, i) => (
                         <SpotlightCard key={i} className="p-6 hover:-translate-y-1 transition-transform duration-300">
                             <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary mb-6">
                                 <feat.icon className={cn("w-6 h-6", feat.color)} />
                             </div>
                             <h3 className="text-xl font-bold mb-3 text-foreground">{feat.title}</h3>
                             <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                         </SpotlightCard>
                     ))}
                 </div>
             </div>
         </section>

         {/* --- MODULES --- */}
         <section id="join-section" className="py-24 bg-secondary/20 border-t border-border/40">
             <div className="container mx-auto px-6">
                 <div className="mb-16 text-center md:text-left">
                     <h2 className="text-4xl md:text-6xl font-black mb-4 text-foreground">Choose your Path.</h2>
                     <p className="text-xl text-muted-foreground">Select your role to start.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {partnerOptions.map((opt, i) => (
                         <div key={opt.id} className="h-[420px]">
                             <PartnerOptionCard option={opt} index={i} />
                         </div>
                     ))}
                 </div>
             </div>
         </section>

         {/* --- HOW IT WORKS --- */}
         <section className="py-24 bg-background border-t border-border/40">
             <div className="container mx-auto px-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                     <div>
                         <h2 className="text-4xl font-bold mb-6 text-foreground">Get started in minutes.</h2>
                         <p className="text-muted-foreground text-lg mb-10">No paperwork. Fully digital onboarding.</p>
                         <div className="space-y-10">
                             {steps.map((step, i) => (
                                 <div key={i} className="flex gap-6 group">
                                     <span className="text-5xl font-black text-muted/40 group-hover:text-emerald-500/20 transition-colors">{step.num}</span>
                                     <div>
                                         <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{step.title}</h4>
                                         <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                     
                     {/* Graphic Placeholder */}
                     <div className="relative h-[500px] rounded-[3rem] bg-secondary border border-border/50 flex items-center justify-center overflow-hidden shadow-2xl">
                         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-50" />
                         <div className="text-center p-10 relative z-10">
                             <div className="scale-150 mb-6"><BrandLogo size="xl" withText={false} /></div>
                             <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Dashboard Preview</p>
                             <div className="mt-8 p-4 bg-background/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-lg max-w-xs mx-auto">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"><Wallet className="w-5 h-5"/></div>
                                     <div className="text-left">
                                         <p className="text-xs font-bold text-muted-foreground uppercase">Total Earnings</p>
                                         <p className="text-xl font-black text-foreground">₹ 24,500</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </section>

         {/* --- FOOTER --- */}
         <footer className="py-12 border-t border-border/40 bg-background text-center">
             <div className="flex justify-center mb-6 opacity-80"><BrandLogo size="md" withText={true} /></div>
             <p className="text-muted-foreground text-sm font-medium">© 2025 Curocity Technologies. Building for the future.</p>
         </footer>

      </main>
    </div>
  )
}
