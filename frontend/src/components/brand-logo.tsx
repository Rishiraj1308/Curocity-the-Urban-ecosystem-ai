'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  withText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  iconClassName?: string; // Added for compatibility
}

export default function BrandLogo({ 
  className, 
  withText = true,
  size = 'md'
}: LogoProps) {

  // Sizes Configuration
  const config = {
    sm: { svg: 'w-6 h-6', text: 'text-base' },
    md: { svg: 'w-9 h-9', text: 'text-xl' },
    lg: { svg: 'w-12 h-12', text: 'text-2xl' },
  };
  const current = config[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none group cursor-pointer", className)}>
      
      {/* --- THE SYMBOL (Tech Nexus) --- */}
      <div className="relative flex items-center justify-center">
        <svg 
          className={cn("transition-transform duration-300 group-hover:scale-105", current.svg)} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="techGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
              <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
            </linearGradient>
          </defs>

          {/* The Main Structure */}
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C26.8 36 32.6 31.8 34.9 25.8L28.2 23.5C26.8 26.5 23.6 28.8 20 28.8C15.1 28.8 11.2 24.9 11.2 20C11.2 15.1 15.1 11.2 20 11.2C23.6 11.2 26.8 13.5 28.2 16.5L34.9 14.2C32.6 8.2 26.8 4 20 4Z" 
            fill="url(#techGradient)"
          />
          
          {/* The "Active" Square Block */}
          <rect 
            x="26" y="16" width="8" height="8" rx="2" 
            className="fill-cyan-500 dark:fill-cyan-400"
          />
        </svg>
      </div>

      {/* --- THE WORDMARK --- */}
      {withText && (
        <div className="flex flex-col justify-center">
          <span className={cn(
            "font-extrabold tracking-tight leading-none text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors",
            current.text
          )}>
            Curocity
          </span>
        </div>
      )}
    </div>
  );
};