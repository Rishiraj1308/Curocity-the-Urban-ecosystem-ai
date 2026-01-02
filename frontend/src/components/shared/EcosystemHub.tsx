'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
    Car, Wrench, HeartPulse, Loader2, CheckCircle2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useFirebase } from '@/lib/firebase/client-provider'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

// ✅ STRICT TYPING
type PartnerType = 'path' | 'resq' | 'cure' | 'chemist';

interface EcosystemProps {
    currentType: PartnerType; 
    userData: {
        uid: string;
        name: string;
        phone: string;
        currentLocation?: any; 
    };
}

export const EcosystemHub = ({ currentType, userData }: EcosystemProps) => {
    const { db } = useFirebase();
    const [loadingService, setLoadingService] = useState<string | null>(null);

    // 🔥 REQUEST LOGIC
    const handleServiceRequest = async (targetService: PartnerType, issueType: string) => {
        if (!userData.currentLocation) {
            return toast.error("GPS Error", { description: "Location needed for service." });
        }

        setLoadingService(issueType);

        try {
            await addDoc(collection(db, "ecosystem_requests"), {
                requesterId: userData.uid,
                requesterName: userData.name,
                requesterPhone: userData.phone,
                requesterType: currentType,
                targetService: targetService,
                issueType: issueType,
                status: 'pending',
                location: userData.currentLocation, 
                createdAt: serverTimestamp()
            });

            toast.success("Request Sent!", {
                description: `Searching nearby ${targetService.toUpperCase()} partner.`
            });

        } catch (error) {
            toast.error("Network Error");
        } finally {
            setLoadingService(null);
        }
    };

    // --- CARD COMPONENT ---
    const ServiceCard = ({ 
        type, title, subtitle, color, icon: Icon, actions 
    }: { type: string, title: string, subtitle: string, color: string, icon: any, actions: { label: string, id: string }[] }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-3xl border border-zinc-800/50 bg-zinc-900/40 relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-500`}><Icon size={80} /></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-zinc-800 text-${color}-500`}>
                        <Icon size={20} />
                    </div>
                    <Badge variant="outline" className={`bg-${color}-500/10 text-${color}-500 border-${color}-500/20 uppercase text-[10px]`}>
                        {type} Partner
                    </Badge>
                </div>
                
                <h3 className="text-lg font-black text-white uppercase italic tracking-wide">{title}</h3>
                <p className="text-xs text-zinc-500 font-medium mb-4">{subtitle}</p>

                <div className="grid grid-cols-2 gap-2">
                    {actions.map((action) => (
                        <Button 
                            key={action.id}
                            variant="outline" 
                            disabled={loadingService !== null}
                            onClick={() => handleServiceRequest(type.toLowerCase() as PartnerType, action.id)}
                            className={`h-10 rounded-xl text-[10px] font-bold uppercase border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all`}
                        >
                            {loadingService === action.id ? <Loader2 className="animate-spin w-3 h-3" /> : action.label}
                        </Button>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 pb-32">
            <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-6 rounded-[2rem] border border-zinc-800 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-blue-500" />
                <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">Partner Nexus</h2>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Unified Ecosystem Services</p>
            </div>

            <div className="grid gap-4">
                {currentType !== 'resq' && (
                    <ServiceCard 
                        type="ResQ" title="Roadside Assist" subtitle="Instant Repair & Towing" color="amber" icon={Wrench}
                        actions={[{ label: 'Tyre Fix', id: 'puncture' }, { label: 'Tow Truck', id: 'towing' }]}
                    />
                )}

                {currentType !== 'cure' && (
                    <ServiceCard 
                        type="Cure" title="Medical Support" subtitle="Priority Care" color="blue" icon={HeartPulse}
                        actions={[{ label: 'Call Doctor', id: 'telemed' }, { label: 'Ambulance', id: 'ambulance' }]}
                    />
                )}

                {currentType !== 'path' && (
                    <ServiceCard 
                        type="Path" title="Logistics" subtitle="Rides & Delivery" color="emerald" icon={Car}
                        actions={[{ label: 'Book Ride', id: 'ride' }, { label: 'Send Parcel', id: 'parcel' }]}
                    />
                )}
            </div>
        </div>
    )
}