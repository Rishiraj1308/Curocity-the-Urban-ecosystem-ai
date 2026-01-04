"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, History, Wallet, User, LifeBuoy, Sun, Moon, Languages, LogOut, ChevronDown, MessageSquare, Shield } from 'lucide-react';
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

// 🔥 UI: DYNAMIC ANIMATED BACKGROUND (Pehle Jaisa - Moving Blobs)
const DeepBackground = ({ isDark }: { isDark: boolean }) => (
    <div className={cn("fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700", isDark ? "bg-[#050505]" : "bg-[#F5F7FA]")}>
        
        {/* Blob 1: Top Right (Floating) */}
        <motion.div 
            animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-20 transition-colors duration-700", isDark ? "bg-blue-900" : "bg-blue-300")} 
        />
        
        {/* Blob 2: Bottom Left (Floating) */}
        <motion.div 
            animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 transition-colors duration-700", isDark ? "bg-purple-900" : "bg-purple-300")} 
        />
        
        {/* Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
)

// --- COMPONENTS ---
function LanguageToggle() {
    const { setLanguage, language } = useLanguage()
    return (
        <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="rounded-full w-9 h-9 text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90">
            <Languages className="h-4 w-4" />
        </Button>
    )
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    return (
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-9 h-9 text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 relative">
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
  const { theme } = useTheme();

  const isMapPage = pathname === '/user/ride-map';
  const showGlobalUI = !isMapPage;
  const isRideBooking = pathname?.includes('/ride-booking');
  const isDark = theme === 'dark';

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

  // Header Animation: Smooth Slide Down
  const headerVariants = {
    hidden: { y: -40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 15 } }
  };

  if (isUserLoading || !isMounted) return <div className="h-screen w-full bg-[#F5F7FA] dark:bg-[#050505]" />;
  if(!user) return <div className="h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#050505]"><Skeleton className="h-screen w-full bg-black/5 dark:bg-white/5" /></div>;
  
  return (
    <div className={cn("h-full min-h-screen antialiased font-sans relative overflow-hidden transition-colors duration-300", isDark ? "text-white" : "text-neutral-900")}>
        
        {/* GLOBAL BACKGROUND (With Animation) */}
        <DeepBackground isDark={isDark} />

        {/* 🔥 HEADER: FULLY TRANSPARENT (No Blur) */}
        <AnimatePresence>
        {showGlobalUI && (
             <motion.header 
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className={cn(
                  "fixed top-0 left-0 right-0 z-50 w-full px-6 py-6 transition-all duration-500 bg-transparent", 
                  isRideBooking ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
             >
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    
                    {/* LEFT: LOGO */}
                    <Link href="/user" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                        <BrandLogo size="md" withText={true} />
                    </Link>

                    {/* RIGHT: FLOATING PILL */}
                    <div className={cn(
                        "flex items-center gap-1 p-1 pl-2 rounded-full border transition-all",
                        // Very subtle background to ensure visibility without looking blocked
                        isDark ? "bg-white/5 border-white/5 text-white" : "bg-white/40 border-black/5 text-neutral-900"
                    )}>
                        <ThemeToggle />
                        <LanguageToggle />
                        <div className={cn("h-5 w-[1px] mx-1", isDark ? "bg-white/10" : "bg-black/10")} />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-2 rounded-full transition-all outline-none active:scale-95">
                                <Avatar className={cn("h-9 w-9 border shadow-sm", isDark ? "border-white/10" : "border-black/5")}>
                                    <AvatarImage src={user?.photoURL || undefined} className="object-cover" />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-white">{getInitials(user?.displayName)}</AvatarFallback>
                                </Avatar>
                              </button>
                          </DropdownMenuTrigger>
                          
                          <DropdownMenuContent align="end" className={cn("w-56 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl", isDark ? "bg-[#111]/90 border-white/10 text-white" : "bg-white/95 border-black/5 text-neutral-900")}>
                            <DropdownMenuLabel className="font-normal px-2 py-1.5">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold">{user?.displayName}</p>
                                    <p className={cn("text-xs truncate", isDark ? "text-white/50" : "text-black/50")}>{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className={isDark ? "bg-white/10" : "bg-black/5"} />
                            
                            {navItems.map(item => (
                                <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className={cn("rounded-lg cursor-pointer", isDark ? "text-white/80 focus:bg-cyan-500/20 focus:text-cyan-400" : "text-neutral-700 focus:bg-cyan-50 focus:text-cyan-600")}>
                                    <item.icon className="w-4 h-4 mr-2 opacity-70"/> {item.label}
                                </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator className={isDark ? "bg-white/10" : "bg-black/5"} />
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={cn("rounded-lg cursor-pointer text-red-500", isDark ? "focus:bg-red-500/20" : "focus:bg-red-50")}>
                                        <LogOut className="w-4 h-4 mr-2"/> Logout
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className={cn("border", isDark ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/5 text-neutral-900")}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Log out?</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className={cn("border", isDark ? "bg-transparent border-white/10 text-white hover:bg-white/10" : "bg-transparent border-black/10 text-black hover:bg-black/5")}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">Logout</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                className={cn(showGlobalUI ? (isRideBooking ? 'pt-0 pb-32' : 'pt-24 pb-32') : 'h-full')}
            >
            {children}
            </motion.main>
        </AnimatePresence>

        {/* --- BOTTOM NAV & FABs (Floating) --- */}
        {showGlobalUI && !isRideBooking && (
            <>
                <div className="fixed bottom-24 right-5 z-40 flex flex-col items-center gap-3">
                    <Button size="icon" className={cn("h-12 w-12 rounded-full border shadow-lg hover:scale-105 transition-transform backdrop-blur-md", isDark ? "border-white/10 bg-[#111]/80 text-white hover:bg-white/10" : "border-black/5 bg-white/80 text-neutral-800 hover:bg-white")}>
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <Button size="icon" className={cn("h-12 w-12 rounded-full border shadow-lg hover:scale-105 transition-transform backdrop-blur-md", isDark ? "border-white/10 bg-[#111]/80 text-white hover:bg-white/10" : "border-black/5 bg-white/80 text-neutral-800 hover:bg-white")}>
                      <Shield className="h-5 w-5" />
                    </Button>
                </div>

                <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[360px] px-4">
                    <nav className={cn("flex items-center justify-between px-3 h-[72px] rounded-[2.5rem] backdrop-blur-2xl border shadow-xl transition-all duration-500", isDark ? "bg-[#050505]/80 border-white/10 shadow-black/50" : "bg-white/80 border-white/40 shadow-black/5")}>
                      {navItems.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                              <Link 
                                key={item.href} 
                                href={item.href} 
                                className={cn(
                                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300",
                                  isActive 
                                    ? "text-cyan-500 -translate-y-1" 
                                    : (isDark ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/70")
                                )}
                              >
                                {isActive && (
                                    <motion.div layoutId="nav-pill" className={cn("absolute inset-0 rounded-full border", isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-100")} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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