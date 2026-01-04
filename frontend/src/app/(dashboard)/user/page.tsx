'use client';

import React, { useState, useEffect, useMemo, FC } from 'react';
import {
  Search, Mic, Car, Wrench, Zap, Stethoscope, Menu,
  Sparkles, Activity, ThermometerSun, Wind, FlaskConical, Plus, MapPin, Bell, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useFirebase } from '@/lib/firebase/client-provider';
import { getDoc, doc } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// --- ANIMATION VARIANTS (Simple Entry) ---
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const ITEM_VARIANTS_SMOOTH = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } },
};

// ====================================================================================================================
// --- UI COMPONENTS (Stable & Clean) ---
// ====================================================================================================================

// 1. TOP HUD (Weather)
const TopHUD = () => {
  const weatherData = { temp: 31, condition: 'Hazy', aqi: 128 }; 
  return (
    <motion.section variants={ITEM_VARIANTS_SMOOTH}>
      <div className={cn(
        'grid grid-cols-3 gap-2 text-center text-xs p-4 rounded-[2rem] border transition-all duration-500',
        // Light Mode: Clean White Glass
        'bg-white/70 border-white shadow-sm backdrop-blur-xl',
        // Dark Mode: Deep Black Glass
        'dark:bg-white/5 dark:border-white/10 dark:shadow-none'
      )}>
        <div className="flex flex-col items-center">
            <ThermometerSun size={20} className="text-amber-500 mb-1" />
            <span className="font-bold text-base text-gray-900 dark:text-white">{weatherData.temp}°C</span>
            <span className="opacity-60 text-[10px] text-gray-600 dark:text-white/50">{weatherData.condition}</span>
        </div>
        <div className="flex flex-col items-center border-l border-gray-200 dark:border-white/10">
            <Wind size={20} className="text-cyan-500 mb-1" />
            <span className="font-bold text-base text-gray-900 dark:text-white">{weatherData.aqi}</span>
            <span className="opacity-60 text-[10px] text-gray-600 dark:text-white/50">AQI</span>
        </div>
        <div className="flex flex-col items-center border-l border-gray-200 dark:border-white/10">
            <Activity size={20} className="text-emerald-500 mb-1" />
            <span className="font-bold text-base text-gray-900 dark:text-white">Low</span>
            <span className="opacity-60 text-[10px] text-gray-600 dark:text-white/50">Traffic</span>
        </div>
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
      ride: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-100 dark:border-cyan-500/20' },
      resq: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/20 border-amber-100 dark:border-amber-500/20' },
      cure: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/20 border-red-100 dark:border-red-500/20' },
    };
    const t = tones[tone];
    
    return (
        <motion.div variants={ITEM_VARIANTS_SMOOTH} whileTap={{ scale: 0.98 }}>
            <div className={cn(
                'p-4 rounded-[2rem] flex items-center gap-4 border transition-all duration-500 backdrop-blur-md',
                // Light Mode
                'bg-white/80 border-white shadow-sm hover:shadow-md',
                // Dark Mode
                'dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:shadow-none'
            )}>
                <div className={cn('w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl border', t.bg)}>
                    <Icon size={22} className={t.text} />
                </div>
                <div className="flex-1">
                    <p className="text-[14px] font-bold text-gray-900 dark:text-white tracking-wide">{title}</p>
                    <p className="text-[11px] leading-tight mt-0.5 text-gray-500 dark:text-white/50">{desc}</p>
                </div>
                <button className={cn(
                    "p-2.5 rounded-full transition-colors duration-500 border",
                    "bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-400",
                    "dark:bg-white/5 dark:hover:bg-white/20 dark:text-white/70 dark:border-white/5"
                )}>
                    <Plus size={18} />
                </button>
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
  
  const styles: Record<ToneType, { icon: string; bg: string }> = {
    cyan: { icon: 'text-cyan-500 dark:text-cyan-400', bg: 'group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/20' },
    amber: { icon: 'text-amber-500 dark:text-amber-400', bg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-500/20' },
    red:   { icon: 'text-red-500 dark:text-red-400',  bg: 'group-hover:bg-red-50 dark:group-hover:bg-red-500/20' },
    green: { icon: 'text-emerald-500 dark:text-emerald-400', bg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20' },
    purple:{ icon: 'text-purple-500 dark:text-purple-400', bg: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-500/20' },
    gray:  { icon: 'text-gray-400 dark:text-gray-400',   bg: 'group-hover:bg-gray-100 dark:group-hover:bg-white/10' },
  };

  const currentStyle = styles[tone];

  return (
    <Link href={href} className="block h-full">
      <motion.div variants={ITEM_VARIANTS_SMOOTH} whileTap={{ scale: 0.95 }} whileHover={{ y: -5 }} className={cn(
          'h-full p-5 rounded-[2.5rem] flex flex-col justify-between group transition-all duration-500 border backdrop-blur-xl',
          // Light Mode
          'bg-white/70 border-white/50 hover:bg-white shadow-sm hover:shadow-lg',
          // Dark Mode
          'dark:bg-white/5 dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-white/10 dark:shadow-none'
      )}>
        <div className="flex justify-between items-start">
            <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 border',
                'bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5',
                currentStyle.bg
            )}>
                <Icon size={24} strokeWidth={2} className={currentStyle.icon} />
            </div>
            <span className={cn(
                "px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border",
                "bg-white border-gray-100 text-gray-500",
                "dark:border-white/10 dark:bg-black/20 dark:text-white/60"
            )}>
                {meta}
            </span>
        </div>
        <div className="mt-5">
            <h3 className="font-bold text-[16px] tracking-wide text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs font-medium mt-0.5 text-gray-500 dark:text-white/40">{sub}</p>
        </div>
      </motion.div>
    </Link>
  );
};

// ====================================================================================================================
// --- MAIN PAGE ---
// ====================================================================================================================

export default function UserHUDPage() {
  const { user, db } = useFirebase();
  const [userName, setUserName] = useState('User');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  
  useEffect(() => { setMounted(true); }, []);
  
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

  if (!mounted) return <div className="min-h-screen bg-transparent" />;

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans bg-transparent">
      
      <div className="relative z-10 max-w-[500px] mx-auto flex flex-col min-h-screen">
        
        {/* HEADER */}
        <motion.div variants={ITEM_VARIANTS_SMOOTH} initial="hidden" animate="show" className="px-6 pt-10 mb-6">
           <div className="flex justify-between items-start mb-6">
               <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1 text-gray-500 dark:text-white/40">{greeting}</p>
                  <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{userName}.</h2>
               </div>
               <div className={cn(
                   "p-3 rounded-full border backdrop-blur-md shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer",
                   "bg-white/50 border-gray-200 text-gray-600",
                   "dark:bg-white/5 dark:border-white/10 dark:text-white/70"
               )}>
                   <Bell size={20} />
               </div>
           </div>

          {/* SEARCH BAR */}
          <div className={cn(
              'w-full rounded-[2rem] border px-5 py-4 flex items-center gap-3 transition-all duration-500 backdrop-blur-xl group',
              'bg-white/80 border-white shadow-sm hover:shadow-md',
              'dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:shadow-none'
            )}>
            <Search size={20} className="text-gray-400 dark:text-white/40 group-focus-within:text-cyan-500 transition-colors" />
            <input 
                placeholder="Where to next?" 
                className="bg-transparent w-full outline-none text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-white/30 text-gray-900 dark:text-white" 
            />
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 mx-1"></div>
            <Mic size={20} className="text-cyan-500 dark:text-cyan-400 cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </motion.div>

        {/* SCROLLABLE CONTENT */}
        <motion.main variants={CONTAINER_VARIANTS} initial="hidden" animate="show" className="flex-1 px-6 space-y-8 overflow-y-auto no-scrollbar pb-24">
          
          <TopHUD />

          <section className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold pl-2 text-gray-400 dark:text-white/30">Suggestions</p>
            <div className="space-y-3">
                <SmartAction title="Go home?" desc="Surge pricing is low. 4 min away." icon={Car} tone="ride" />
                <SmartAction title="Check bike health?" desc="Nearby mechanic available." icon={Wrench} tone="resq" />
                <SmartAction title="Emergency?" desc="One-tap ambulance dispatch." icon={Zap} tone="cure" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between pl-2 pr-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30">Modules</p>
              <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">
                  <MapPin size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">View Map</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <ServiceTile title="Ride" sub="City · Path" icon={Car} href="/user/ride-booking" meta="Live" tone="cyan" />
              <ServiceTile title="ResQ" sub="Roadside help" icon={Wrench} href="/user/resq" meta="24/7" tone="amber" />
              <ServiceTile title="SOS · Cure" sub="Emergency" icon={Zap} href="/user/cure-booking" meta="Priority" tone="red" />
              <ServiceTile title="Doctor" sub="Consultation" icon={Stethoscope} href="/user/appointment-booking" meta="Care" tone="green" />
              <ServiceTile title="Lab Tests" sub="Home Collect" icon={FlaskConical} href="/user/lab-tests" meta="Health" tone="purple" />
              <ServiceTile title="More" sub="All services" icon={Menu} href="/user/modules" meta="Explore" tone="gray" />
            </div>
          </section>

          {/* ASSIST BUTTON */}
          <section>
            <motion.button 
                variants={ITEM_VARIANTS_SMOOTH} 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.97 }} 
                className={cn(
                    'w-full rounded-[2rem] py-5 px-6 flex items-center justify-between gap-3 font-semibold text-sm transition-all duration-500 border backdrop-blur-xl',
                    // Light Mode
                    'bg-white border-white shadow-md text-gray-800 hover:shadow-lg',
                    // Dark Mode
                    'dark:bg-gradient-to-r dark:from-cyan-900/40 dark:to-blue-900/40 dark:border-white/10 dark:text-white dark:hover:from-cyan-800/50 dark:hover:to-blue-800/50'
            )}>
              <div className="flex items-center gap-4">
                  <div className={cn(
                      "p-2 rounded-full border",
                      "bg-cyan-50 border-cyan-100 dark:bg-white/10 dark:border-white/10"
                  )}>
                      <Sparkles size={18} className="text-cyan-500 dark:text-cyan-300" />
                  </div>
                  <div className="text-left">
                      <span className="block leading-none mb-1 text-base tracking-wide">Curo Assist</span>
                      <span className="text-[11px] font-normal text-gray-500 dark:text-white/50">Ask about routes & help...</span>
                  </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 dark:text-white/30" />
            </motion.button>
          </section>

        </motion.main>
      </div>
    </div>
  );
}