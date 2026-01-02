'use client'
import React from 'react'

// Props interface define karna zaroori hai
interface LiveMapProps {
    activePartners: any[];
}

export default function LiveMap({ activePartners }: LiveMapProps) {
    return (
        <div className="w-full h-full bg-zinc-900/50 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-emerald-500 font-bold tracking-widest text-xs uppercase italic">
                Curocity Navigation Engine
            </p>
            <p className="text-zinc-500 text-[10px] mt-1">
                Displaying {activePartners.length} Active Partners on Radar
            </p>
        </div>
    )
}