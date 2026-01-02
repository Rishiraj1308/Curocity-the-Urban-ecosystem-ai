'use client';

import React, { useState, useEffect } from 'react';
import { Map, Volume2, Globe, Moon, Bell, LogOut, ChevronRight } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SettingsTab() {
  const [navApp, setNavApp] = useState('google');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('navPreference');
    if (saved) setNavApp(saved);
  }, []);

  const handleNavChange = (val: string) => {
    setNavApp(val);
    localStorage.setItem('navPreference', val);
  };

  return (
    <div className="h-full bg-slate-50 p-6 space-y-8 font-sans">
      <h1 className="text-2xl font-black text-slate-900">Settings</h1>

      {/* Navigation Preferences */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation</h3>
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Map className="w-5 h-5" /></div>
                <div>
                    <p className="font-bold text-slate-900">Default Map App</p>
                    <p className="text-xs text-slate-500">Used for turn-by-turn directions</p>
                </div>
            </div>
            <Select value={navApp} onValueChange={handleNavChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="google">Google Maps</SelectItem>
                    <SelectItem value="waze">Waze</SelectItem>
                    <SelectItem value="mappls">Mappls</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </section>

      {/* App Preferences */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">App Preferences</h3>
        
        <SettingItem icon={Volume2} label="Sound Effects" subLabel="Play sound on new request" hasSwitch />
        <SettingItem icon={Moon} label="Dark Mode" subLabel="Better for night driving" hasSwitch />
        <SettingItem icon={Globe} label="Language" subLabel="English" />
      </section>

      <div className="pt-10 text-center text-xs text-slate-400">
        <p>Curocity Partner App v1.0.4</p>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, label, subLabel, hasSwitch }: any) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-lg text-slate-600"><Icon className="w-5 h-5" /></div>
                <div>
                    <p className="font-bold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{subLabel}</p>
                </div>
            </div>
            {hasSwitch ? <Switch /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
        </div>
    )
}