'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RideOptionsSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: string, price: number) => void;
  destinationName: string;
  distance?: number;
  duration?: number;
}

export function RideOptionsSheet({ open, onClose, onSelect, destinationName, distance = 0, duration = 0 }: RideOptionsSheetProps) {
  
  // Pricing Logic
  const basePriceBike = 20;
  const rateBike = 8;
  const priceBike = Math.round(basePriceBike + (distance * rateBike));

  const basePriceCar = 40;
  const rateCar = 12;
  const priceCar = Math.round(basePriceCar + (distance * rateCar));

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div 
         initial={{ y: "100%" }} 
         animate={{ y: 0 }} 
         exit={{ y: "100%" }} 
         className="fixed bottom-0 left-0 right-0 bg-white z-[100] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="p-6">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h2 className="text-xl font-black text-slate-900">Choose a ride</h2>
                 <p className="text-xs text-slate-500 font-medium">To {destinationName.split(',')[0]}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full bg-slate-50">
                 <X className="w-5 h-5" />
              </Button>
           </div>

           <div className="space-y-3 mb-6">
              {/* Bike Option */}
              <div 
                onClick={() => onSelect('Bike', priceBike)}
                className="flex items-center p-4 border border-slate-100 rounded-2xl hover:border-black transition-all cursor-pointer bg-slate-50/50"
              >
                 <div className="w-16 h-12 relative mr-4">
                     {/* Placeholder for Bike Image - replace with Next Image if you have assets */}
                     <Bike className="w-10 h-10 text-slate-800" /> 
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <h3 className="font-bold text-lg">Moto</h3>
                       <span className="font-bold text-lg">₹{priceBike}</span>
                    </div>
                    <p className="text-xs text-slate-500">{duration} min • Fastest</p>
                 </div>
              </div>

              {/* Car Option */}
              <div 
                onClick={() => onSelect('Car', priceCar)}
                className="flex items-center p-4 border border-slate-100 rounded-2xl hover:border-black transition-all cursor-pointer bg-slate-50/50"
              >
                 <div className="w-16 h-12 relative mr-4">
                      {/* Placeholder for Car Image */}
                      <Car className="w-10 h-10 text-slate-800" />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <h3 className="font-bold text-lg">Cab</h3>
                       <span className="font-bold text-lg">₹{priceCar}</span>
                    </div>
                    <p className="text-xs text-slate-500">{duration + 5} min • Comfy</p>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}