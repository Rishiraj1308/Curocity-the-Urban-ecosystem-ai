"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useDriverLocation } from '@/features/driver/hooks/useDriverLocation';
import { DriverProvider, useDriver } from '@/context/DriverContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// --- LOGIC WRAPPER (No UI, Just Data) ---
function DriverLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, db } = useFirebase();
  
  // 1. Data Fetching via Context
  const { partnerData, isLoading } = useDriver();
  
  // 2. Location Tracking (Background)
  useDriverLocation();
  
  // 3. Logout Logic (Available if needed)
  const handleLogout = async () => {
    if (partnerData?.id && db) {
        await updateDoc(doc(db, 'pathPartners', partnerData.id), { isOnline: false, lastSeen: serverTimestamp() }).catch(err => console.error(err));
    }
    if (auth) auth.signOut();
    localStorage.removeItem('curocity-session');
    toast.success('Logged Out');
    router.push('/');
  };

  // 4. Onboarding check (Skip layout logic for onboarding pages)
  if (pathname.includes('/onboarding')) {
    return <>{children}</>;
  }
  
  // 5. Loading State (Full Screen Black Splash)
  if (isLoading) {
    return (
        <div className="h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center space-y-6">
             {/* Pulsing Logo Effect */}
             <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/30 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500 shadow-[0_0_20px_#10b981]"></span>
             </div>
             <div className="text-center space-y-2">
                 <p className="text-white font-black text-xl tracking-tight">Curocity<span className="text-emerald-500">.</span></p>
                 <div className="flex items-center gap-2 justify-center">
                     <Skeleton className="h-2 w-2 rounded-full bg-gray-600 animate-bounce delay-75" />
                     <Skeleton className="h-2 w-2 rounded-full bg-gray-600 animate-bounce delay-150" />
                     <Skeleton className="h-2 w-2 rounded-full bg-gray-600 animate-bounce delay-300" />
                 </div>
                 <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Loading Profile</p>
             </div>
        </div>
    )
  }

  // 6. RENDER (No Sidebar, Just Children)
  return (
    <div className="h-[100dvh] w-full bg-black text-white relative overflow-hidden font-sans">
        {/* Ye 'children' humara page.tsx hai (Mobile UI) */}
        {children}
    </div>
  );
}

// --- MAIN EXPORT ---
export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
      <DriverProvider>
        <DriverLayoutContent>
            {children}
        </DriverLayoutContent>
      </DriverProvider>
    );
}