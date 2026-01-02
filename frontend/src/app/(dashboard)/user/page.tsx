
'use client';

import React, { useState, useEffect, useMemo, FC } from 'react';
import {
  Search, Mic, Car, Wrench, Zap, Stethoscope, Menu,
  Sparkles, Activity, ThermometerSun, Wind, FlaskConical, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFirebase } from '@/lib/firebase/client-provider';
import { getDoc, doc } from 'firebase/firestore';
import { useTheme } from 'next-themes';

// --- UTILITY ---
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// --- ANIMATION VARIANTS ---
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const ITEM_VARIANTS_SMOOTH = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } },
};
const ITEM_VARIANTS_SNAPPY = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 18 } },
};

// ====================================================================================================================
// --- COMPONENTS ---
// ====================================================================================================================

// 1. TOP HUD (Weather)
const TopHUD = () => {
  const weatherData = { temp: 31, condition: 'Hazy', aqi: 128 }; 
  return (
    <motion.section variants={ITEM_VARIANTS_SMOOTH}>
      <div className={cn(
        'grid grid-cols-3 gap-2 text-center text-xs p-2.5 rounded-2xl border transition-all duration-500',
        'bg-white border-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]', 
        'dark:bg-black/40 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none'
      )}>
        <div className="flex flex-col items-center"><ThermometerSun size={18} className="text-amber-500 mb-1" /><span className="font-bold text-sm text-gray-800 dark:text-white transition-colors duration-500">{weatherData.temp}°C</span><span className="opacity-60 text-[10px] text-gray-500 dark:text-gray-400 transition-colors duration-500">{weatherData.condition}</span></div>
        <div className="flex flex-col items-center border-l border-gray-100 dark:border-white/10 transition-colors duration-500"><Wind size={18} className="text-cyan-500 mb-1" /><span className="font-bold text-sm text-gray-800 dark:text-white transition-colors duration-500">{weatherData.aqi}</span><span className="opacity-60 text-[10px]">AQI</span></div>
        <div className="flex flex-col items-center border-l border-gray-100 dark:border-white/10 transition-colors duration-500"><Activity size={18} className="text-emerald-500 mb-1" /><span className="font-bold text-sm text-gray-800 dark:text-white transition-colors duration-500">Low</span><span className="opacity-60 text-[10px]">Traffic</span></div>
      </div>
    </motion.section>
  );
};

// 2. SMART ACTIONS
interface SmartActionProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  tone: 'ride' | 'resq' | 'cure';
}

const SmartAction: FC<SmartActionProps> = ({ title, desc, icon: Icon, tone }) => {
    const tones = {
      ride: { text: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
      resq: { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
      cure: { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
    };
    const t = tones[tone];
    
    return (
        <motion.div variants={ITEM_VARIANTS_SMOOTH}>
            <div className={cn('p-3.5 rounded-2xl flex items-center gap-3.5 border transition-all duration-500', 'bg-white border-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-gray-50', 'dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:shadow-none')}>
                <div className={cn('w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors duration-500', t.bg)}><Icon size={20} className={t.text} /></div>
                <div className="flex-1"><p className="text-[13px] font-bold text-gray-800 dark:text-white transition-colors duration-500">{title}</p><p className="text-[11px] leading-tight mt-0.5 text-gray-500 dark:text-gray-400 transition-colors duration-500">{desc}</p></div>
                <button className={cn("p-2 rounded-full transition-colors duration-500", "bg-gray-50 hover:bg-gray-100 text-gray-400", "dark:bg-white/10 dark:hover:bg-white/20 dark:text-white/70")}><Plus size={16} /></button>
            </div>
        </motion.div>
    );
};

// 3. SERVICE TILE
type ToneType = 'cyan' | 'amber' | 'red' | 'green' | 'purple' | 'gray';

interface ServiceTileProps {
  icon: React.ElementType;
  title: string;
  sub: string;
  href: string;
  meta: string;
  tone: ToneType;
}

const ServiceTile: FC<ServiceTileProps> = ({ icon: Icon, title, sub, href, meta, tone }) => {
  
  const styles: Record<ToneType, { icon: string; tag: string }> = {
    cyan: { icon: 'text-cyan-500', tag: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20' },
    amber: { icon: 'text-amber-500', tag: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    red:   { icon: 'text-red-500',  tag: 'bg-red-500/10 text-red-700 border-red-500/20' },
    green: { icon: 'text-emerald-500', tag: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    purple:{ icon: 'text-purple-500', tag: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
    gray:  { icon: 'text-gray-400',   tag: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
  };

  const currentStyle = styles[tone];

  return (
    <Link href={href} className="block h-full">
      <motion.div variants={ITEM_VARIANTS_SNAPPY} whileTap={{ scale: 0.97 }} whileHover={{ y: -3 }} className={cn('h-full p-4 rounded-[24px] overflow-hidden flex flex-col justify-between group transition-all duration-500 border', 'bg-white border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]', 'dark:bg-[#181818]/80 dark:border-white/5 dark:hover:border-white/10 dark:backdrop-blur-xl dark:shadow-none')}>
        <div className="flex justify-between items-start"><div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500', 'bg-gray-50 group-hover:bg-gray-100', 'dark:bg-white/5 dark:group-hover:bg-white/10')}><Icon size={22} strokeWidth={2} className={currentStyle.icon} /></div><span className={cn("px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-colors duration-500", currentStyle.tag)}>{meta}</span></div>
        <div className="mt-4"><h3 className="font-bold text-[15px] text-gray-800 dark:text-gray-100 transition-colors duration-500">{title}</h3><p className="text-xs font-medium text-gray-500 dark:text-gray-500 transition-colors duration-500">{sub}</p></div>
      </motion.div>
    </Link>
  );
};

const NoiseOverlay = () => (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
        <svg className="w-full h-full"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#noise)" /></svg>
    </div>
);

// ====================================================================================================================
// --- MAIN PAGE ---
// ====================================================================================================================

export default function UserHUDPage() {
  const { user, db } = useFirebase();
  const [userName, setUserName] = useState('User');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  
  useEffect(() => { setMounted(true); }, []);
  
  const isDark = mounted && theme === 'dark';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    if (user && db) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists()) setUserName(docSnap.data().name.split(' ')[0]);
      });
    }
  }, [user, db]);

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-cyan-500/30 bg-transparent text-foreground">
      
      {/* --- BACKGROUND AMBIENCE (THE SMOOTH FIX) --- */}
      <div className="absolute inset-0 -z-10">
        {/* Base Image */}
        <img src="https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1600&q=80" alt="City map" className="w-full h-full object-cover transition-opacity duration-700 opacity-80 dark:opacity-60" />
        
        {/* LAYER 1: LIGHT GRADIENT (Always there, bottom layer) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-[#F2F4F8]/95" />

        {/* LAYER 2: DARK GRADIENT (Sits on top, fades in smoothly) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95 opacity-0 dark:opacity-100 transition-opacity duration-700 ease-in-out" />
      </div>
      
      <NoiseOverlay />

      {/* --- MAIN FRAME --- */}
      <div className="relative z-10 max-w-[500px] mx-auto flex flex-col min-h-screen">
        
        {/* GREETING & SEARCH */}
        <motion.div variants={ITEM_VARIANTS_SMOOTH} initial="hidden" animate="show" className="px-5 mb-4">
           <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 dark:opacity-50 transition-colors duration-500">{greeting}</p>
              <h2 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white transition-colors duration-500">{userName}, city is active.</h2>
           </div>

          <div className={cn(
              'w-full rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all duration-500',
              'bg-white border-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]', 
              'dark:bg-[#1a1a1a]/60 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none'
            )}>
            <Search size={18} className="text-gray-400" />
            <input placeholder="Where to next?" className="bg-transparent w-full outline-none text-sm font-medium placeholder:text-gray-400 text-gray-900 dark:placeholder:text-gray-600 dark:text-white transition-colors duration-500" />
            <Mic size={18} className="text-cyan-500 opacity-80" />
          </div>
        </motion.div>

        {/* SCROLLABLE CONTENT */}
        <motion.main variants={CONTAINER_VARIANTS} initial="hidden" animate="show" className="flex-1 px-5 space-y-6 overflow-y-auto no-scrollbar">
          <TopHUD />
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold pl-1 text-gray-400 dark:opacity-50 transition-colors duration-500">Suggestions</p>
            <SmartAction title="Go home?" desc="Surge pricing is low. 4 min away." icon={Car} tone="ride" />
            <SmartAction title="Check bike health?" desc="Nearby mechanic available." icon={Wrench} tone="resq" />
            <SmartAction title="Emergency?" desc="One-tap ambulance dispatch." icon={Zap} tone="cure" />
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:opacity-50 transition-colors duration-500">Modules</p>
              <span className="text-[10px] text-cyan-600 font-medium dark:opacity-40 transition-colors duration-500">View Map</span>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <ServiceTile title="Ride" sub="City · Path" icon={Car} href="/user/ride-booking" meta="Live" tone="cyan" />
              <ServiceTile title="ResQ" sub="Roadside help" icon={Wrench} href="/user/resq" meta="24/7" tone="amber" />
              <ServiceTile title="SOS · Cure" sub="Emergency" icon={Zap} href="/user/cure-booking" meta="Priority" tone="red" />
              <ServiceTile title="Doctor" sub="Consultation" icon={Stethoscope} href="/user/appointment-booking" meta="Care" tone="green" />
              <ServiceTile title="Lab Tests" sub="Home Collect" icon={FlaskConical} href="/user/lab-tests" meta="Health" tone="purple" />
              <ServiceTile title="More" sub="All services" icon={Menu} href="/user/modules" meta="Explore" tone="gray" />
            </div>
          </section>
          <section className="pb-4">
            <motion.button variants={ITEM_VARIANTS_SNAPPY} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className={cn('w-full rounded-[24px] py-4 px-5 flex items-center justify-between gap-3 font-semibold text-sm shadow-xl transition-all duration-500', 'bg-[#111] text-white shadow-gray-300', 'dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-700 dark:text-white dark:shadow-cyan-900/20')}>
              <div className="flex items-center gap-3"><div className="p-1.5 bg-white/20 rounded-full"><Sparkles size={16} fill="white" /></div><div className="text-left"><span className="block leading-none mb-0.5">Curo Assist</span><span className="text-[11px] font-normal opacity-80">Ask about routes & help...</span></div></div>
            </motion.button>
          </section>
        </motion.main>
      </div>
    </div>
  );
}
