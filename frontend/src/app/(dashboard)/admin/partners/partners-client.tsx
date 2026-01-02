'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useDb } from '@/lib/firebase/client-provider'
import { collection, query, getDocs, doc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Check, X, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function PartnersClient() {
    const [allPartners, setAllPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const db = useDb();

    const fetchAllPartners = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const collections = [
                { name: 'pathPartners', type: 'driver' },
                { name: 'mechanics', type: 'mechanic' },
                { name: 'curePartners', type: 'cure' }
            ];
            let combined: any[] = [];
            for (const { name, type } of collections) {
                const snap = await getDocs(query(collection(db, name)));
                combined.push(...snap.docs.map(d => ({ id: d.id, type, ...d.data() })));
            }
            setAllPartners(combined.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        } catch (e) { toast.error("Fetch failed"); } finally { setIsLoading(false); }
    }, [db]);

    useEffect(() => { fetchAllPartners(); }, [fetchAllPartners]);

    const handleUpdateStatus = async (partner: any, newStatus: string) => {
        if (!db) return;
        const collectionName = partner.type === 'driver' ? 'pathPartners' : 
                             partner.type === 'mechanic' ? 'mechanics' : 'curePartners';
        
        // 🔥 Hamesha partner.id (UID) use karo
        const partnerRef = doc(db, collectionName, partner.id);
        
        const updateData: any = { 
            status: newStatus, 
            updatedAt: serverTimestamp(),
            isVerified: newStatus === 'verified'
        };

        if (newStatus === 'verified') {
            const exp = new Date(); exp.setDate(exp.getDate() + 60);
            updateData.subscriptionStatus = 'trial';
            updateData.trialExpiryDate = Timestamp.fromDate(exp);
        }

        try {
            // ✅ setDoc with merge avoids "No document to update" error
            await setDoc(partnerRef, updateData, { merge: true });
            toast.success("Status Updated!"); 
            fetchAllPartners();
        } catch (e) { toast.error("Update failed"); }
    };

    if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>

    return (
        <div className="space-y-6 bg-black min-h-screen p-6">
            <Card className="bg-zinc-900 border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="italic font-black text-white uppercase">Partner Control</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input placeholder="Search ID..." className="pl-9 bg-black border-zinc-800" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow className="border-white/5"><TableHead className="text-zinc-500 uppercase text-xs">Partner</TableHead><TableHead className="text-zinc-500 uppercase text-xs">Status</TableHead><TableHead className="text-right text-zinc-500 uppercase text-xs">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {allPartners.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                <TableRow key={p.id} className="border-white/5">
                                    <TableCell><div className="font-bold text-emerald-500 italic uppercase">{p.name}</div><div className="text-[10px] text-zinc-500 font-mono">{p.partnerId}</div></TableCell>
                                    <TableCell><Badge variant="outline" className="uppercase text-[10px] italic">{p.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={14}/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-zinc-950 text-white border-white/10">
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(p, 'verified')} className="text-emerald-500 font-bold italic">Verify Partner</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(p, 'rejected')} className="text-red-500 font-bold italic">Reject</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}