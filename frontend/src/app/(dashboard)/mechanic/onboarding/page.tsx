'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { ArrowLeft, Activity, ShieldCheck, Phone } from 'lucide-react'
import { useFirebase } from '@/lib/firebase/client-provider'
import { generateSmartId } from "@/lib/firebase/idGenerator"
import BrandLogo from '@/components/shared/brand-logo'

export default function MechanicOnboardingPage() {
    const router = useRouter()
    const { db, auth } = useFirebase()
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1)
    
    const [formData, setFormData] = useState({
        name: '', phone: '', panCard: '', aadhaarNumber: '',
        garageName: '', address: '',
    });

    const updateForm = (field: string, val: string) => setFormData(p => ({ ...p, [field]: val }));

    const handleFinalSubmit = async () => {
        const user = auth?.currentUser;
        if (!user) return;
        setIsLoading(true);
        try {
            const sId = await generateSmartId("mechanics", "CZR");
            const docRef = doc(db, 'mechanics', user.uid); // ✅ UID as Doc ID
            await setDoc(docRef, {
                ...formData,
                phone: user.phoneNumber,
                partnerId: sId,
                authUid: user.uid,
                status: 'pending_verification',
                isOnline: false,
                createdAt: serverTimestamp(),
            }, { merge: true });
            toast.success("Application Sent!");
            router.push('/partner-login');
        } catch (error) { toast.error("Submission Failed"); } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xl bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800">
                <header className="text-center mb-8"><BrandLogo className="mb-4" /><h1 className="text-2xl font-black text-amber-500 uppercase italic">ResQ Partner Setup</h1></header>
                <div className="space-y-4">
                    <Input className="h-14 bg-black border-zinc-800 rounded-2xl" placeholder="Full Name" value={formData.name} onChange={e => updateForm('name', e.target.value)} />
                    <Input className="h-14 bg-black border-zinc-800 rounded-2xl" placeholder="Aadhaar No" value={formData.aadhaarNumber} onChange={e => updateForm('aadhaarNumber', e.target.value)} />
                    <Button className="h-14 w-full bg-amber-600 rounded-2xl font-bold uppercase" onClick={handleFinalSubmit} disabled={isLoading}>{isLoading ? "Saving..." : "Initialize ResQ"}</Button>
                </div>
            </div>
        </div>
    );
}