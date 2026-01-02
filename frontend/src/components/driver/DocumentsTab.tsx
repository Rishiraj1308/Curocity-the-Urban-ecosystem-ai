'use client';

import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock, Upload, Eye, ShieldCheck, Car } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DocumentsTab({ data }: { data: any }) {
  
  // 🔥 COMPLETE DOCUMENT LIST (Mock Data mapped to DB keys)
  const documents = [
    // --- PERSONAL DOCUMENTS ---
    { id: 1, category: 'Personal', title: 'Driving License', status: 'verified', expiry: '12 Oct 2028', url: data?.drivingLicenceUrl },
    { id: 2, category: 'Personal', title: 'Aadhaar Card', status: 'verified', expiry: null, url: data?.aadhaarUrl },
    { id: 3, category: 'Personal', title: 'PAN Card', status: 'verified', expiry: null, url: data?.panUrl },
    { id: 4, category: 'Personal', title: 'Police Verification (PCC)', status: 'pending', expiry: '01 Jan 2026', url: data?.pccUrl },

    // --- VEHICLE DOCUMENTS ---
    { id: 5, category: 'Vehicle', title: 'Vehicle RC', status: 'verified', expiry: '05 May 2030', url: data?.rcUrl },
    { id: 6, category: 'Vehicle', title: 'Vehicle Insurance', status: 'expired', expiry: '01 Nov 2023', url: data?.insuranceUrl }, // Expired Example
    { id: 7, category: 'Vehicle', title: 'Pollution Cert (PUC)', status: 'pending', expiry: '15 Jan 2024', url: data?.pucUrl },
    { id: 8, category: 'Vehicle', title: 'Vehicle Permit', status: 'verified', expiry: '20 Dec 2025', url: data?.permitUrl },
    { id: 9, category: 'Vehicle', title: 'Fitness Certificate', status: 'verified', expiry: '10 Aug 2024', url: data?.fitnessUrl },
  ];

  // Calculate Completion
  const totalDocs = documents.length;
  const verifiedDocs = documents.filter(d => d.status === 'verified').length;
  const progress = Math.round((verifiedDocs / totalDocs) * 100);
  const attentionDocs = documents.filter(d => d.status === 'expired' || d.status === 'rejected').length;

  return (
    <div className="p-6 pb-24 space-y-6 font-sans bg-slate-50 min-h-full">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900">My Documents</h1>
        <p className="text-slate-500 text-sm">Upload all required documents to go online.</p>
      </div>

      {/* STATUS OVERVIEW */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
            <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Status</span>
                <h3 className={`text-lg font-black ${progress === 100 ? 'text-green-600' : 'text-slate-900'}`}>
                    {progress === 100 ? 'Fully Verified' : 'In Progress'}
                </h3>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-slate-100 flex items-center justify-center font-bold text-xs">
                {progress}%
            </div>
        </div>
        <Progress value={progress} className="h-2 bg-slate-100" />
        
        {attentionDocs > 0 && (
            <div className="mt-4 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 
                {attentionDocs} Document(s) expired or rejected. Action needed.
            </div>
        )}
      </div>

      {/* DOCUMENT LIST BY CATEGORY */}
      <ScrollArea className="h-full">
          <div className="space-y-6">
            
            {/* Personal Section */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Personal Documents
                </h3>
                {documents.filter(d => d.category === 'Personal').map(doc => (
                    <DocumentCard key={doc.id} doc={doc} />
                ))}
            </section>

            {/* Vehicle Section */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehicle Documents
                </h3>
                {documents.filter(d => d.category === 'Vehicle').map(doc => (
                    <DocumentCard key={doc.id} doc={doc} />
                ))}
            </section>

          </div>
      </ScrollArea>
    </div>
  );
}

// Single Document Card
function DocumentCard({ doc }: { doc: any }) {
    const isExpired = doc.status === 'expired';
    const isPending = doc.status === 'pending';
    const isVerified = doc.status === 'verified';
    const isRejected = doc.status === 'rejected';

    const handleUpload = () => {
        toast.info(`Opening camera for ${doc.title}...`);
        // Real app: File Picker logic here
        setTimeout(() => toast.success("Document uploaded for review"), 1500);
    };

    return (
        <div className={`p-4 rounded-xl border bg-white ${
            isExpired || isRejected ? 'border-red-200 bg-red-50/50' : 'border-slate-200 shadow-sm'
        } transition-all`}>
            
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${
                        isVerified ? 'bg-green-100 text-green-600' : 
                        (isExpired || isRejected) ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                        {doc.expiry ? (
                            <p className={`text-[10px] font-medium ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                                {isExpired ? 'Expired on ' : 'Valid till '}{doc.expiry}
                            </p>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-medium">Lifetime Validity</p>
                        )}
                    </div>
                </div>
                
                {isVerified && <Badge className="bg-green-500 hover:bg-green-600 h-6"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>}
                {isPending && <Badge className="bg-yellow-500 hover:bg-yellow-600 h-6"><Clock className="w-3 h-3 mr-1" /> Reviewing</Badge>}
                {(isExpired || isRejected) && <Badge variant="destructive" className="h-6"><AlertTriangle className="w-3 h-3 mr-1" /> {isRejected ? 'Rejected' : 'Expired'}</Badge>}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 h-9 text-xs border-slate-200 text-slate-600 hover:bg-slate-50">
                            <Eye className="w-3 h-3 mr-2" /> View
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-sm mx-auto">
                        <div className="bg-white p-2 rounded-xl">
                            <img src={doc.url || "https://placehold.co/600x400/png?text=No+Document"} alt="Doc" className="w-full rounded-lg" />
                            <Button className="w-full mt-2" variant="secondary">Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {(!isVerified) && (
                    <Button onClick={handleUpload} className={`flex-1 h-9 text-xs ${isExpired || isRejected ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900'}`}>
                        <Upload className="w-3 h-3 mr-2" /> {isExpired ? "Renew Now" : isRejected ? "Re-upload" : "Upload"}
                    </Button>
                )}
            </div>
        </div>
    )
}