'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    onAuthStateChanged, 
    User, 
    signOut,
    setPersistence, 
    browserLocalPersistence 
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // 🔥 Apne firebase config ka path check karlena
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            // 🔥 YEH LINE SESSION KO PERMANENT KARTI HAI
            await setPersistence(auth, browserLocalPersistence);

            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
                setLoading(false); // Checking complete
            });

            return () => unsubscribe();
        };

        initAuth();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {/* Jab tak check kar rahe hain, spinner dikhao taaki login page par redirect na ho */}
            {loading ? (
                <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-500" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};