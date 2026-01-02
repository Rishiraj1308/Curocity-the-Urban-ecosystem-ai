'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart as BarChartIcon, Clock, Users, Activity, AlertTriangle, Map } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import dynamic from 'next/dynamic'

// 🔥 FIX 1: Import path points to 'maps' and removed SSR for Leaflet compatibility
const LiveMap = dynamic(() => import('@/components/maps'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center"><p className="text-zinc-500 text-xs italic">Loading Intelligence Map...</p></div>,
});

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
            <Icon className="w-4 h-4 text-emerald-500"/>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black italic tracking-tighter text-white">{value}</div>
            <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">{description}</p>
        </CardContent>
    </Card>
);

const responseTimeData = [
  { zone: 'South Delhi', time: 7.2 },
  { zone: 'Gurgaon', time: 8.5 },
  { zone: 'Noida', time: 9.1 },
  { zone: 'East Delhi', time: 10.5 },
  { zone: 'West Delhi', time: 8.8 },
];

const casesByHourData = [
  { hour: '08 AM', cases: 5 },
  { hour: '11 AM', cases: 12 },
  { hour: '02 PM', cases: 8 },
  { hour: '05 PM', cases: 15 },
  { hour: '08 PM', cases: 22 },
  { hour: '11 PM', cases: 18 },
]

export default function AnalyticsPage() {
    return (
        <div className="p-6 space-y-6 bg-[#050505] min-h-screen text-white">
            <header className="flex flex-col gap-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Analytics Hub</h2>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Performance Insights & Operational Intelligence</p>
            </header>
            
             <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                <Activity className="h-4 w-4" />
                <AlertTitle className="font-bold uppercase text-xs tracking-widest">System Active</AlertTitle>
                <AlertDescription className="text-[10px] opacity-80 uppercase font-medium">
                    Analytics engine is processing live data from Path, ResQ, and Cure partners.
                </AlertDescription>
            </Alert>

            {/* QUICK STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Cases Handled"
                    value="1,254"
                    icon={Activity}
                    description="+15% Efficiency Increase"
                />
                 <StatCard 
                    title="Avg. Response Time"
                    value="8.2 min"
                    icon={Clock}
                    description="-5% Delay Reduction"
                />
                 <StatCard 
                    title="Fleet Utilization"
                    value="76%"
                    icon={Users}
                    description="Peak demand handled: 92%"
                />
            </div>
            
            {/* HEATMAP SECTION */}
            <Card className="bg-zinc-900/50 border-white/5 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white italic uppercase tracking-tighter">
                        <Map className="w-5 h-5 text-emerald-500"/> Demand Heatmap
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-xs font-medium">
                        Strategically reposition fleet based on high-demand hotspots.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-80 w-full p-0 relative">
                    {/* 🔥 FIX 2: Added activePartners prop to prevent TS error and used mock data */}
                    <LiveMap activePartners={[]} />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />
                </CardContent>
            </Card>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/50 border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white italic uppercase tracking-tighter text-sm">Response Time by Zone</CardTitle>
                        <CardDescription className="text-zinc-500 text-[10px]">Average minutes per rescue operation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{ time: { label: "Time", color: "#10b981" } }} className="h-64">
                            <BarChart data={responseTimeData}>
                                <CartesianGrid vertical={false} stroke="#ffffff10" />
                                <XAxis dataKey="zone" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} stroke="#71717a" />
                                <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#71717a" tickFormatter={(v) => `${v}m`} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="time" fill="var(--color-time)" radius={8} barSize={30} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                 <Card className="bg-zinc-900/50 border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white italic uppercase tracking-tighter text-sm">Peak Emergency Hours</CardTitle>
                        <CardDescription className="text-zinc-500 text-[10px]">Hourly case distribution for staff optimization.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{ cases: { label: "Cases", color: "#ef4444" } }} className="h-64">
                             <BarChart data={casesByHourData}>
                                <CartesianGrid vertical={false} stroke="#ffffff10" />
                                <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} stroke="#71717a" />
                                <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#71717a" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="cases" fill="var(--color-cases)" radius={8} barSize={30} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}