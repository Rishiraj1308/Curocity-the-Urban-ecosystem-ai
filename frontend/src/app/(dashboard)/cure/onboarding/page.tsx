'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useFirebase } from '@/lib/firebase/client-provider'
import { generateSmartId } from "@/lib/firebase/idGenerator"
import BrandLogo from '@/components/shared/brand-logo'

export default function CureOnboardingPage() {
    const router = useRouter()
    const { db, auth } = useFirebase()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({ businessType: 'Hospital', name: '', phone: '', registrationNumber: '' });

    const handleFinalSubmit = async () => {
        const user = auth?.currentUser;
        if (!user) return;
        setIsLoading(true);
        try {
            const sId = await generateSmartId("curePartners", formData.businessType === 'Hospital' ? "CZH" : "CZC");
            const partnerDocRef = doc(db, "curePartners", user.uid); // ✅ UID as Doc ID
            await setDoc(partnerDocRef, { ...formData, phone: user.phoneNumber, partnerId: sId, authUid: user.uid, status: 'pending_verification', createdAt: serverTimestamp() }, { merge: true });
            toast.success("Application Submitted!");
            router.push('/partner-login'); 
        } catch (e) { toast.error("Submission failed"); } finally { setIsLoading(false); }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xl bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800">
                <header className="text-center mb-8"><BrandLogo className="mb-4" /><h1 className="text-2xl font-black text-emerald-500 uppercase italic">Cure Registration</h1></header>
                <div className="space-y-4">
                    <Select onValueChange={(v) => setFormData(p => ({ ...p, businessType: v }))} defaultValue={formData.businessType}>
                        <SelectTrigger className="h-14 bg-black border-zinc-800 rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Hospital">Hospital</SelectItem><SelectItem value="Clinic">Clinic</SelectItem></SelectContent>
                    </Select>
                    <Input className="h-14 bg-black border-zinc-800 rounded-2xl" placeholder="Official Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                    <Button className="h-14 w-full bg-emerald-600 rounded-2xl font-bold uppercase" onClick={handleFinalSubmit} disabled={isLoading}>{isLoading ? "Saving..." : "Complete Setup"}</Button>
                </div>
            </div>
        </div>
    )
}