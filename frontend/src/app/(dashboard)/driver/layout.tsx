"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useDriverLocation } from '@/features/driver/hooks/useDriverLocation';
import { DriverProvider, useDriver } from '@/context/DriverContext';
import { toast } from 'sonner';

// --- 1. INNER LOGIC COMPONENT ---
// Ye component Provider ke ANDAR rahega, isliye 'useDriver' yahan chalega
function DriverLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { auth, db } = useFirebase();
  
  // Data aur Loading state uthao
  const { partnerData, isLoading } = useDriver();
  
  // Background Location Tracking
  useDriverLocation();

  // Loading Screen (Jab tak profile load ho rahi hai)
  if (isLoading) {
    return (
        <div className="h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center space-y-6">
             <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/30 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500 shadow-[0_0_20px_#10b981]"></span>
             </div>
             <p className="text-emerald-500 text-xs font-mono uppercase tracking-[0.3em] animate-pulse">
                System Initializing...
             </p>
        </div>
    );
  }

  // Main Content Render
  return (
    <div className="h-[100dvh] w-full bg-black text-white overflow-hidden relative font-sans overscroll-none selection:bg-emerald-500/30">
      {children}
    </div>
  );
}

// --- 2. MAIN LAYOUT EXPORT ---
// Ye sabse pehle load hoga aur Provider set karega
export default function DriverLayout({ children }: { children: React.ReactNode }) {
    return (
      <DriverProvider>
        <DriverLayoutInner>
            {children}
        </DriverLayoutInner>
      </DriverProvider>
    );
}