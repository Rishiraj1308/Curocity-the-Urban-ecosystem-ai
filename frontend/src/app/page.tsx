'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  useMotionTemplate,
  AnimatePresence,
  useInView
} from 'framer-motion';

import { cn } from '@/lib/utils';
import {
  Menu, Sun, Moon, Zap, Shield, Heart, Car, Instagram, Twitter, Linkedin, 
  Package, Wrench, MapPin, CheckCircle2, Users, Star, ChevronDown, Plus, Minus
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. UTILITIES & EFFECTS                                                     */
/* -------------------------------------------------------------------------- */

const BrandLogo = () => (
  <span className="text-2xl font-black tracking-tighter mix-blend-difference text-white">CUROCITY</span>
);

const Spotlight = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden dark:block"
      style={{
        background: useMotionTemplate`
          radial-gradient(
            600px circle at ${mouseX}px ${mouseY}px,
            rgba(29, 78, 216, 0.15),
            transparent 80%
          )
        `,
      }}
    />
  );
};

const LiveActivity = () => {
  const [activity, setActivity] = useState("Analyzing City Traffic...");
  
  useEffect(() => {
    const messages = [
      "Rohan booked a Bike in Sec-21",
      "New Mechanic joined in Dwarka",
      "High demand detected in CP",
      "Ambulance dispatched to Vasant Kunj",
      "3200+ Active Partners Live",
      "Surge pricing disabled via ResQ"
    ];
    let i = 0;
    const interval = setInterval(() => {
      setActivity(messages[i]);
      i = (i + 1) % messages.length;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-[10px] md:text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">
        {activity}
      </span>
    </motion.div>
  );
};

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.04] mix-blend-overlay">
    <svg className="w-full h-full">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const increment = 100 / steps;
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= 100) { clearInterval(timer); return 100; }
        return next;
      });
    }, intervalTime);
    const completeTimer = setTimeout(() => onComplete(), duration + 300);
    return () => { clearInterval(timer); clearTimeout(completeTimer); };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white"
      initial={{ y: 0 }}
      exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 relative">
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter">CUROCITY</h1>
        <div className="h-1 bg-cyan-500 w-full mt-2" />
      </motion.div>
      <div className="text-xl font-mono overflow-hidden h-8 flex items-center">
        <span className="block">{Math.round(count)}%</span>
      </div>
    </motion.div>
  );
};

interface ParallaxProps { children: React.ReactNode; baseVelocity: number; className?: string; }
function ParallaxText({ children, baseVelocity = 100, className }: ParallaxProps) {
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
    <div className="parallax overflow-hidden m-0 whitespace-nowrap flex flex-nowrap">
      <motion.div style={{ x }} className={cn("scroller font-black uppercase text-6xl md:text-9xl flex whitespace-nowrap flex-nowrap", className)}>
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
        <span className="block mr-8">{children} </span>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. SECTIONS                                                                */
/* -------------------------------------------------------------------------- */

const HeroReveal = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 40]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [0.4, 1]);

  return (
    <section ref={targetRef} className="h-[200vh] relative bg-black">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">
        <motion.div style={{ opacity: videoOpacity }} className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1495527870239-c2c349e44950?q=80&w=2070" alt="City" className="w-full h-full object-cover opacity-60 absolute inset-0" />
          <video autoPlay loop muted playsInline className="w-full h-full object-cover filter brightness-75 absolute inset-0 transition-all duration-500" src="https://cdn.coverr.co/videos/coverr-driving-through-the-city-at-night-4304/1080p.mp4" />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
        <motion.div style={{ scale, opacity }} className="relative z-10 text-center flex flex-col items-center justify-center h-full pb-20">
          <h1 className="text-[12vw] md:text-[13vw] font-black leading-none tracking-tighter text-white whitespace-nowrap">CUROCITY</h1>
          <div className="mt-4 flex items-center gap-4 overflow-hidden">
            <div className="h-[1px] w-10 md:w-20 bg-white" />
            <p className="text-xs md:text-xl font-medium tracking-[0.3em] uppercase text-white">The Ecosystem</p>
            <div className="h-[1px] w-10 md:w-20 bg-white" />
          </div>
        </motion.div>
        <motion.div style={{ opacity }} className="absolute bottom-8 text-white animate-bounce flex flex-col items-center transition-colors duration-500 z-20">
          <p className="text-[10px] md:text-xs tracking-widest mb-2 font-bold">SCROLL TO ENTER</p>
          <div className="w-[1px] h-8 md:h-12 bg-white" />
        </motion.div>
      </div>
    </section>
  );
};

const VisionSection = () => {
  return (
    <section className="py-32 px-4 md:px-20 bg-white dark:bg-black relative overflow-hidden transition-colors duration-500">
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10 items-center">
        <div>
          <div className="inline-block px-3 py-1 border border-blue-500/30 rounded-full text-blue-600 dark:text-blue-400 text-xs font-mono mb-6 uppercase tracking-widest">The Concept</div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-none mb-6">
            An Operating System <br /><span className="text-slate-400 dark:text-neutral-600">for Urban Life.</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-neutral-400 leading-relaxed mb-8">
            Cities are fragmented. You have one app for rides, another for food, and zero for emergencies. <br/><br/>
            <strong className="text-slate-900 dark:text-white">Curocity connects the dots.</strong> We unify transport, healthcare, and essential services into a single, breathing network.
          </p>
          <div className="flex gap-8">
             <div className="flex flex-col"><span className="text-3xl font-black text-slate-900 dark:text-white">10k+</span><span className="text-xs text-slate-500 uppercase tracking-widest">Partners</span></div>
             <div className="flex flex-col"><span className="text-3xl font-black text-slate-900 dark:text-white">24/7</span><span className="text-xs text-slate-500 uppercase tracking-widest">Support</span></div>
             <div className="flex flex-col"><span className="text-3xl font-black text-slate-900 dark:text-white">0%</span><span className="text-xs text-slate-500 uppercase tracking-widest">Commission</span></div>
          </div>
        </div>
        <div className="relative h-[400px] bg-slate-100 dark:bg-neutral-900 rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center group shadow-xl">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
           <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-blue-500 rounded-full blur-[50px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse opacity-50" />
              <div className="relative z-10 p-6 bg-white dark:bg-black rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10">
                 <div className="text-4xl font-black mb-2">OS</div>
                 <p className="text-[10px] uppercase tracking-widest">Curocity v1.0</p>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const StoryBlock = ({ story, index }: { story: any, index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center p-6 border-b border-slate-200 dark:border-white/5 relative z-20 bg-white dark:bg-black transition-colors duration-500">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0.2, x: -20 }}
          transition={{ duration: 0.6 }}
          className="order-2 md:order-1"
        >
          <div className="flex items-center gap-4 mb-6">
             <span className="text-6xl font-black text-slate-200 dark:text-white/10">0{index + 1}</span>
             <div className={`px-4 py-1 rounded-full ${story.bg} text-white text-xs font-bold uppercase tracking-widest shadow-lg`}>{story.subtitle}</div>
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 leading-[1] tracking-tight">{story.title}</h2>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-neutral-400 leading-relaxed max-w-lg border-l-4 border-slate-200 dark:border-white/10 pl-6">{story.desc}</p>
        </motion.div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, rotate: 10 }}
          animate={isInView ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.9, opacity: 0, rotate: -10 }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="order-1 md:order-2 flex justify-center"
        >
          <div className={`relative w-full max-w-md aspect-square rounded-[3rem] ${story.glow} bg-white dark:bg-black border-4 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-2xl`}>
             <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.05]" />
             <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} opacity-10`} />
             <div className="relative z-10 flex flex-col items-center text-center p-10 w-full">
                <div className="mb-8 p-6 bg-slate-50 dark:bg-white/5 backdrop-blur-xl rounded-full border border-slate-200 dark:border-white/10 shadow-xl">
                   {story.icon}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{story.mockupTitle}</h3>
                <p className="text-slate-500 dark:text-white/60 font-mono text-sm tracking-widest uppercase mb-8">{story.mockupStatus}</p>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: "0%" }} animate={isInView ? { width: "100%" } : { width: "0%" }} transition={{ duration: 1.5, delay: 0.2 }} className={`h-full ${story.bg}`} />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CinematicStorySection = () => {
  const stories = [
    { subtitle: "LOGISTICS", title: "Gridlock detected?", desc: "Bypass the chaos. Instant bikes, autos, and cabs at your command.", bg: "bg-blue-600", gradient: "from-blue-600 to-indigo-900", glow: "shadow-[0_0_100px_-20px_rgba(37,99,235,0.3)]", icon: <Car className="w-16 h-16 text-blue-500" />, mockupTitle: "Driver Arriving", mockupStatus: "ETA: 2 MINS" },
    { subtitle: "COURIER", title: "Forgot keys?", desc: "We pick up and drop anything. Laptop chargers, tiffins, or gifts.", bg: "bg-purple-600", gradient: "from-purple-600 to-fuchsia-900", glow: "shadow-[0_0_100px_-20px_rgba(147,51,234,0.3)]", icon: <Package className="w-16 h-16 text-purple-500" />, mockupTitle: "Picked Up", mockupStatus: "On the way" },
    { subtitle: "HEALTHCARE", title: "System Failure?", desc: "Doctors and meds delivered in minutes. Health is priority.", bg: "bg-emerald-600", gradient: "from-emerald-600 to-teal-900", glow: "shadow-[0_0_100px_-20px_rgba(5,150,105,0.3)]", icon: <Heart className="w-16 h-16 text-emerald-500" />, mockupTitle: "Dr. Sharma", mockupStatus: "Video Call..." },
    { subtitle: "MECHANICAL", title: "Malfunction?", desc: "Stranded on the highway. Deploying mechanic unit to your coordinates.", bg: "bg-orange-600", gradient: "from-orange-600 to-amber-900", glow: "shadow-[0_0_100px_-20px_rgba(234,88,12,0.3)]", icon: <Zap className="w-16 h-16 text-orange-500" />, mockupTitle: "Mechanic Found", mockupStatus: "Diagnostics" },
    { subtitle: "URBAN HELP", title: "Home Repairs?", desc: "Plumbers, Electricians, and Cleaners. Verified pros at your doorstep.", bg: "bg-pink-600", gradient: "from-pink-600 to-rose-900", glow: "shadow-[0_0_100px_-20px_rgba(219,39,119,0.3)]", icon: <Wrench className="w-16 h-16 text-pink-500" />, mockupTitle: "Plumber Assigned", mockupStatus: "Arriving..." },
    { subtitle: "EMERGENCY", title: "Critical Alert?", desc: "SOS Protocol. One tap alerts local partners and police.", bg: "bg-red-600", gradient: "from-red-600 to-rose-900", glow: "shadow-[0_0_100px_-20px_rgba(220,38,38,0.3)]", icon: <Shield className="w-16 h-16 text-red-500" />, mockupTitle: "SOS SENT", mockupStatus: "Help is coming" }
  ];
  return <section className="bg-white dark:bg-black relative transition-colors duration-500">{stories.map((story, i) => <StoryBlock key={i} story={story} index={i} />)}</section>;
};

/* TESTIMONIALS SECTION (MISSING PART 1) */
const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-slate-50 dark:bg-neutral-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center text-slate-900 dark:text-white mb-16">
          Trust Protocol <span className="text-emerald-500">Verified</span>.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Rahul S.", role: "Daily Commuter", text: "Finally an app that works in Dwarka. No cancellations, and the drivers actually know the routes." },
            { name: "Priya M.", role: "Mother", text: "Used the medical service at 2 AM for my daughter. Medicine delivered in 15 mins. Lifesaver." },
            { name: "Amit K.", role: "Shop Owner", text: "I use the Genie service to send deliveries to my customers. Cheaper than hiring a delivery boy." }
          ].map((t, i) => (
            <div key={i} className="bg-white dark:bg-black p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 relative">
              <div className="text-emerald-500 mb-4"><Star className="fill-current w-5 h-5" /></div>
              <p className="text-slate-600 dark:text-neutral-400 mb-6 text-lg">"{t.text}"</p>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">{t.name}</h4>
                <p className="text-xs text-slate-400 uppercase tracking-widest">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* FAQ SECTION (MISSING PART 2) */
const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Is Curocity safer than other apps?", a: "Yes. We verify every partner physically. Plus, our SOS button alerts nearby partners instantly, creating a community safety net." },
    { q: "Do you charge surge pricing?", a: "No. Our prices are fixed based on distance. We believe in fair pricing for you and fair earnings for our drivers." },
    { q: "How do I become a partner?", a: "Download the app, go to Partner Hub, and submit your documents. Verification takes 24 hours." },
    { q: "Where is Curocity available?", a: "Currently live in Delhi NCR, focusing on Dwarka and West Delhi. Expanding soon." }
  ];

  return (
    <section className="py-24 px-4 bg-white dark:bg-black transition-colors duration-500">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-black text-center text-slate-900 dark:text-white mb-12">Common Queries</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-slate-200 dark:border-white/10">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full py-6 flex justify-between items-center text-left">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{f.q}</span>
                {open === i ? <Minus className="text-slate-400" /> : <Plus className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="pb-6 text-slate-600 dark:text-neutral-400">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const AppShowcaseSection = () => {
  return (
    <section className="py-32 px-4 md:px-8 bg-slate-50 dark:bg-neutral-950 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Designed for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Chaos</span>.
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 max-w-2xl mx-auto text-lg">We didn't just build an app. We built a survival kit for urban life.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-lg dark:shadow-none">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6"><Zap size={24} /></div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Precision Live Tracking</h3>
              <p className="text-slate-500 dark:text-neutral-400 max-w-md">Share your live location with family. Watch your driver arrive in real-time on our 3D map interface.</p>
            </div>
          </div>
          <div className="col-span-1 p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-lg dark:shadow-none">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6"><Shield size={24} /></div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Secure Rides</h3>
              <p className="text-slate-500 dark:text-neutral-400 text-sm">24/7 SOS support. Verified partners. Your safety is our code.</p>
            </div>
          </div>
          <div className="col-span-1 p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-lg dark:shadow-none">
             <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={24} /></div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Hidden Fees</h3>
              <p className="text-slate-500 dark:text-neutral-400 text-sm">Zero commission model means cheaper rides for you and more earnings for drivers.</p>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 relative overflow-hidden group flex flex-col md:flex-row items-center gap-8 shadow-lg dark:shadow-none">
            <div className="flex-1 text-left">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-6"><Menu size={24} /></div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Stop App Hopping</h3>
              <p className="text-slate-500 dark:text-neutral-400">Delete the clutter. Book a plumber while riding a cab. One OS for everything.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DownloadCTA = () => (
    <section className="py-24 bg-white dark:bg-neutral-950 text-center relative overflow-hidden border-t border-slate-200 dark:border-white/10 transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-slate-900 dark:text-white">
                READY TO <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">UPGRADE?</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-neutral-600 mb-12 max-w-2xl mx-auto">
                Join thousands of users who have already switched to Curocity. The city is yours.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xl hover:scale-105 transition-transform flex items-center gap-3 justify-center shadow-2xl">
                    Download App
                </button>
                <Link href="/partner-hub" className="px-10 py-5 bg-transparent border-2 border-black dark:border-white text-black dark:text-white rounded-full font-bold text-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                    Become a Partner
                </Link>
            </div>
        </div>
    </section>
);

/* -------------------------------------------------------------------------- */
/* 3. MAIN PAGE                                                               */
/* -------------------------------------------------------------------------- */

export default function FinalPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle dark class on html/body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={cn("min-h-screen font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-500")}>
      <NoiseOverlay />
      <Spotlight />
      {!isLoading && <LiveActivity />}

      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <div className={cn("transition-opacity duration-1000", isLoading ? "opacity-0" : "opacity-100")}>
        
        {/* HEADER */}
        <header className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 md:py-6 flex justify-between items-center mix-blend-difference text-white">
          <BrandLogo />
          <div className="hidden md:flex gap-4 z-50 items-center">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white hover:text-black transition-all">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/login" className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur hover:bg-white hover:text-black transition-all text-sm font-medium">Login</Link>
            <Link href="/partner-hub" className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-cyan-400 transition-colors">Partner Hub</Link>
          </div>
          <div className="flex md:hidden gap-3 z-50 items-center">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <Link href="/login" className="w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><div className="w-4 h-4 bg-white rounded-full" /></Link>
             <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black"><Menu size={18} /></button>
          </div>
        </header>

        <main>
          {/* 1. HERO */}
          <HeroReveal />

          {/* 2. MARQUEE */}
          <section className="py-12 md:py-24 bg-cyan-500 text-black overflow-hidden -rotate-2 scale-110 border-y-4 md:border-y-8 border-black relative z-10">
            <ParallaxText baseVelocity={-3} className="text-black text-5xl md:text-9xl">MOVE HEAL FIX MOVE HEAL FIX</ParallaxText>
          </section>

          {/* 3. GLITCH INTRO */}
          <section className="py-32 px-4 md:px-20 max-w-7xl mx-auto relative z-10 bg-white dark:bg-black text-center transition-colors duration-500">
            <h2 className="text-4xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
              The city is <span className="text-cyan-600 dark:text-cyan-500">alive</span>.<br />
              But the system is{' '}
              <span className="relative inline-block text-red-600">
                <span className="absolute top-0 left-0 -ml-0.5 translate-x-[2px] text-red-600 opacity-70 animate-pulse">broken</span>
                <span className="relative z-10 line-through decoration-4 decoration-black/30 dark:decoration-white/30">broken</span>
                <span className="absolute top-0 left-0 ml-0.5 -translate-x-[2px] text-blue-600 opacity-70 animate-pulse delay-75">broken</span>
              </span>.
            </h2>
            <p className="mt-8 text-xl text-slate-500 dark:text-neutral-400 max-w-2xl mx-auto">
                We built a new operating system for urban life. One app to replace them all.
            </p>
          </section>

          {/* 4. VISION */}
          <VisionSection />

          {/* 5. STORY SECTION */}
          <CinematicStorySection />

          {/* 6. APP FEATURES */}
          <AppShowcaseSection />

          {/* 7. TESTIMONIALS (NEW) */}
          <TestimonialsSection />

          {/* 8. FAQ (NEW) */}
          <FAQSection />

          {/* 9. FINAL CTA */}
          <DownloadCTA />

          {/* 10. FOOTER */}
          <footer className="bg-neutral-900 text-white pt-20 pb-10 border-t border-neutral-800">
             <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-2">
                   <h2 className="text-3xl font-black tracking-tighter mb-6">CUROCITY</h2>
                   <p className="text-neutral-400 max-w-md">Building the operating system for modern urban living. Connecting cities, one service at a time.</p>
                </div>
                <div>
                   <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-cyan-500">Company</h4>
                   <ul className="space-y-2 text-neutral-400 text-sm">
                      <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                      <li><Link href="/partner-hub" className="hover:text-white transition-colors">Partner Hub</Link></li>
                   </ul>
                </div>
                <div>
                   <h4 className="font-bold mb-4 uppercase tracking-widest text-sm text-cyan-500">Legal</h4>
                   <ul className="space-y-2 text-neutral-400 text-sm">
                      <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                      <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                   </ul>
                </div>
             </div>
             <div className="max-w-7xl mx-auto px-4 md:px-8 border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-neutral-500 text-sm">© 2025 CuroCity Technologies.</p>
                <div className="flex gap-4">
                   <Instagram className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer transition-colors" />
                   <Twitter className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer transition-colors" />
                   <Linkedin className="w-5 h-5 text-neutral-500 hover:text-white cursor-pointer transition-colors" />
                </div>
             </div>
          </footer>

        </main>
      </div>
    </div>
  );
}