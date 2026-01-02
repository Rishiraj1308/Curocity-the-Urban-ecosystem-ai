'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Car, Wrench, Ambulance } from 'lucide-react';
import { motion } from 'framer-motion';

export interface SearchingIndicatorProps {
  partnerType: 'ride' | 'path' | 'resq' | 'cure';
}

const config: Record<
  SearchingIndicatorProps['partnerType'],
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  // Ride booking (user side)
  ride: {
    icon: Car,
    color: 'hsl(var(--primary))',
  },
  // Path partners (drivers)
  path: {
    icon: Car,
    color: 'hsl(var(--primary))',
  },
  // Garage / ResQ
  resq: {
    icon: Wrench,
    color: 'hsl(var(--amber-500, 24 9.8% 30%))',
  },
  // Ambulance / Cure
  cure: {
    icon: Ambulance,
    color: 'hsl(var(--destructive))',
  },
};

const SearchingIndicator: React.FC<SearchingIndicatorProps> = ({
  partnerType = 'path',
}) => {
  const { icon: Icon, color } = config[partnerType];

  return (
    <div className={cn('relative w-48 h-48 mx-auto flex items-center justify-center')}>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient
              id={`gradient-${partnerType}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                style={{ stopColor: color, stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: color, stopOpacity: 0 }}
              />
            </radialGradient>
          </defs>
          <path
            d="M 50,50 L 50,5 A 45,45 0 0,1 95,50 Z"
            fill={`url(#gradient-${partnerType})`}
          />
        </svg>
      </motion.div>

      <motion.div
        className="w-20 h-20 rounded-full flex items-center justify-center bg-background shadow-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-10 h-10" style={{ color }} />
      </motion.div>
    </div>
  );
};

export default SearchingIndicator;
