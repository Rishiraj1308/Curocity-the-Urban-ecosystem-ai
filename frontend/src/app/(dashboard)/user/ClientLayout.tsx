"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, History, Wallet, User, LifeBuoy, Sun, Moon, Languages, MessageSquare, Shield, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/shared/brand-logo';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useFirebase } from '@/lib/firebase/client-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-provider';
import { ActiveRequestProvider } from '@/features/user/components/active-request-provider';

const navItems = [
    { href: '/user', label: 'Services', icon: Home },
    { href: '/user/activity', label: 'Activity', icon: History },
    { href: '/user/wallet', label: 'Wallet', icon: Wallet },
    { href: '/user/profile', label: 'Profile', icon: User },
    { href: '/user/support', label: 'Support', icon: LifeBuoy },
]

// --- COMPONENTS ---
function LanguageToggle() {
    const { setLanguage, language } = useLanguage()
    return (
        <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <Languages className="h-4 w-4" />
        </Button>
    )
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    return (
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all relative">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
}

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading, db, auth } = useFirebase();

  const isMapPage = pathname === '/user/ride-map';
  const showGlobalUI = !isMapPage;

  // 🔥 LOGIC: Check if we are on the Ride Booking Page
  const isRideBooking = pathname?.includes('/ride-booking');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) router.replace('/login?role=user');
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    if (!auth) return;
    if (user?.uid && db) {
      updateDoc(doc(db, 'users', user.uid), { isOnline: false });
    }
    auth.signOut().then(() => {
      localStorage.removeItem('curocity-session');
      router.push('/login?role=user');
      toast.success('Logged Out');
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? names[0][0] + names[1][0] : name.substring(0, 2);
  }

  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } }
  };

  if (isUserLoading || !isMounted) return <div className="h-screen w-full bg-[#F2F4F8] dark:bg-black" />;
  if(!user) return <div className="h-screen flex items-center justify-center"><Skeleton className="h-screen w-full" /></div>;
  
  return (
    <div className="h-full min-h-screen antialiased text-foreground !bg-[#F2F4F8] dark:!bg-black font-sans relative overflow-hidden transition-colors duration-300">
        
        {/* GLOBAL HEADER */}
        <AnimatePresence>
        {showGlobalUI && (
             <motion.header 
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                // 🔥 FIX: Agar 'isRideBooking' hai toh Transparent, warna normal Glassy/White
                className={cn(
                  "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                  isRideBooking 
                    ? "bg-transparent border-none" // Ride page pe Transparent
                    : "bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5" // Normal pages pe Solid/Glass
                )}
             >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center justify-between h-16">
                        
                        {/* LEFT: BRAND */}
                        <Link href="/user" className="flex items-center gap-3 group">
                            <BrandLogo size="md" withText={true} />
                        </Link>

                        {/* RIGHT: ACTIONS */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <ThemeToggle />
                            <LanguageToggle />
                            <div className="h-5 w-[1px] bg-gray-300 dark:bg-white/10 mx-2" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <button className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-white/50 dark:hover:bg-white/5 transition-all outline-none">
                                    <Avatar className="h-8 w-8 border border-gray-300/50 dark:border-white/10 shadow-sm">
                                        <AvatarImage src={user?.photoURL || undefined} className="object-cover" />
                                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-neutral-800 font-medium text-gray-600 dark:text-gray-300">{getInitials(user?.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                                  </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#111]">
                                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.displayName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />
                                {navItems.map(item => (
                                    <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="rounded-lg cursor-pointer text-gray-600 dark:text-gray-300 focus:bg-cyan-50 dark:focus:bg-cyan-950/30 focus:text-cyan-600 dark:focus:text-cyan-400">
                                        <item.icon className="w-4 h-4 mr-2 opacity-70"/> {item.label}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700">
                                            <LogOut className="w-4 h-4 mr-2"/> Logout
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Log out?</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">Logout</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </nav>
                </div>
            </motion.header>
        )}
        </AnimatePresence>

        {/* --- MAIN CONTENT --- */}
        <AnimatePresence mode="wait">
            <motion.main 
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                // 🔥 FIX: Agar Ride Booking page hai, toh padding 'pt-0' hogi (Header ke upar chadhega)
                // Baaki pages par 'pt-[70px]' rahega
                className={cn(showGlobalUI ? (isRideBooking ? 'pt-0 pb-32' : 'pt-[70px] pb-32') : 'h-full')}
            >
            {children}
            </motion.main>
        </AnimatePresence>

        {/* --- BOTTOM NAV (Chupa diya Ride Page par) --- */}
        {showGlobalUI && !isRideBooking && (
            <>
                <div className="fixed bottom-24 right-5 z-40 flex flex-col items-center gap-3">
                    <Button size="icon" className="h-12 w-12 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform hover:bg-gray-50">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <Button size="icon" className="h-12 w-12 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-105 transition-transform hover:bg-gray-50">
                      <Shield className="h-5 w-5" />
                    </Button>
                </div>

                <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[360px] px-4">
                    <nav className="flex items-center justify-between px-3 h-[68px] rounded-[2.5rem] bg-white/95 dark:bg-[#111]/95 text-gray-500 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-black/50">
                      {navItems.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                              <Link 
                                key={item.href} 
                                href={item.href} 
                                className={cn(
                                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
                                  isActive 
                                    ? "text-cyan-600 dark:text-cyan-400 -translate-y-1" 
                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                )}
                              >
                                {isActive && (
                                    <motion.div layoutId="nav-pill" className="absolute inset-0 bg-cyan-50 dark:bg-cyan-500/10 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}
                                <item.icon className={cn("w-6 h-6 z-10 transition-all", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                <span className={cn("text-[9px] mt-1 z-10 font-bold tracking-wide transition-all", isActive ? "opacity-100" : "opacity-0 h-0 hidden")}>{item.label}</span>
                              </Link>
                          )
                      })}
                    </nav>
                </footer>
            </>
        )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ActiveRequestProvider>
            <UserLayoutContent>{children}</UserLayoutContent>
        </ActiveRequestProvider>
    )
}