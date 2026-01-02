'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Wrench, HeartPulse, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const benefits = [
    {
        title: 'Curocity ResQ',
        description: 'Get on-road assistance for vehicle breakdowns. 2 free requests/month.',
        icon: Wrench,
        cta: 'Request Assistance',
        href: '#', // Add link if you have it
        count: 2,
        countLabel: 'requests left',
    },
    {
        title: 'Curocity Cure',
        description: 'Free preventive health check-up every 2 months at partner facilities.',
        icon: HeartPulse,
        cta: 'Book Check-up',
        href: '#', // Add link if you have it
        count: 1,
        countLabel: 'check-up available',
    }
]

export default function BenefitsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/driver">
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></button>
                </Link>
                <h1 className="text-2xl font-bold">My Benefits</h1>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/30 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                        <Gem className="w-6 h-6"/> Platinum Partner
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">
                        You have unlocked exclusive perks with your subscription.
                    </p>
                </div>

                <div className="grid gap-4">
                    {benefits.map(benefit => (
                         <Card key={benefit.title} className="bg-[#121212] border-white/10 text-white">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/5 rounded-xl">
                                        <benefit.icon className="w-6 h-6 text-emerald-500"/>
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{benefit.title}</CardTitle>
                                        <CardDescription className="text-xs text-gray-400">{benefit.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="p-3 bg-black/40 rounded-lg border border-white/5 inline-flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">{benefit.count}</span>
                                    <span className="text-xs text-gray-500 font-medium">{benefit.countLabel}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-white text-black hover:bg-gray-200">
                                    {benefit.cta} <ArrowRight className="w-4 h-4 ml-2"/>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <Card className="border-emerald-500/30 bg-emerald-900/10 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-500 text-base">
                            <ShieldCheck className="w-5 h-5" /> Insurance Active
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-xs">
                            Covered for accidental & health emergencies while on-duty.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}