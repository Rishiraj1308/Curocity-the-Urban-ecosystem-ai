'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, ChevronLeft, Phone, MapPin, Mic, Volume2, 
    ShieldCheck, AlertTriangle, Navigation 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { 
    collection, addDoc, query, orderBy, 
    onSnapshot, serverTimestamp, DocumentData 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// 🔥 Types defined to fix TS Error 2339
interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    type?: 'text' | 'location';
    locationLink?: string;
    createdAt?: any;
}

interface RideChatProps {
    rideId: string;
    currentUserId: string;
    otherUserName: string;
    otherUserPhoto: string;
    onBack?: () => void;
    userRole?: 'driver' | 'user';
}

export function RideChat({ rideId, currentUserId, otherUserName, otherUserPhoto, onBack, userRole }: RideChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 🔊 Text-to-Speech (Deep UX for Drivers)
    const speakMessage = (text: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        window.speechSynthesis.speak(utterance);
    };

    // 🎙️ Voice-to-Text (Hands-free for Safety)
    const startVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Browser voice support nahi karta");

        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.start();
    };

    // 📍 Live Location Sharing Logic
    const shareLocation = () => {
        if (!navigator.geolocation) return toast.error("GPS support nahi mila");
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
            await sendMessage("📍 Meri Live Location", "location", link);
            toast.success("Location bhej di gayi!");
        }, () => toast.error("Location access mana kar diya gaya"));
    };

    // 📩 Universal Send Logic
    const sendMessage = async (text: string, type: 'text' | 'location' = 'text', link?: string) => {
        if (!text.trim()) return;
        try {
            await addDoc(collection(db, 'rides', rideId, 'messages'), {
                text,
                senderId: currentUserId,
                type,
                locationLink: link || null,
                createdAt: serverTimestamp(),
            });
            setInputText('');
        } catch (e) { toast.error("Failed to send"); }
    };

    useEffect(() => {
        if (!rideId) return;
        const q = query(collection(db, 'rides', rideId, 'messages'), orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
            
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        return () => unsubscribe();
    }, [rideId]);

    return (
        <div className="flex flex-col h-full bg-[#f4f7f6] font-sans overflow-hidden">
            {/* Elite Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center gap-4 shadow-xl z-10 rounded-b-[2.5rem]">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10 rounded-full"><ChevronLeft /></Button>
                <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-emerald-500 shadow-lg">
                        <AvatarImage src={otherUserPhoto} className="object-cover" />
                        <AvatarFallback className="bg-slate-700 font-bold">{otherUserName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="flex-1">
                    <h3 className="font-black text-sm tracking-tight">{otherUserName}</h3>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Secure Trip
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="bg-white/5 rounded-full" onClick={() => window.open(`tel:${otherUserName}`)}><Phone className="w-4 h-4" /></Button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative group max-w-[85%] p-4 px-6 rounded-[2.2rem] text-[13px] font-bold shadow-sm transition-all ${
                            m.senderId === currentUserId 
                            ? 'bg-slate-900 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                            {m.type === 'location' ? (
                                <div onClick={() => window.open(m.locationLink, '_blank')} className="flex items-center gap-2 cursor-pointer text-blue-600">
                                    <MapPin className="w-4 h-4 animate-bounce" />
                                    <span className="underline italic">Open Live Location</span>
                                </div>
                            ) : (
                                <span>{m.text}</span>
                            )}

                            {/* TTS Button for incoming messages */}
                            {m.senderId !== currentUserId && m.type === 'text' && (
                                <button 
                                    onClick={() => speakMessage(m.text)}
                                    className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Deep Level Footer */}
            <div className="p-6 bg-white rounded-t-[3.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.05)] border-t border-slate-50 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={startVoiceInput} 
                        className={`h-14 w-14 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-100 text-slate-500'}`}
                    >
                        <Mic className={`w-6 h-6 ${isListening ? 'text-white' : ''}`} />
                    </Button>
                    
                    <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 border border-slate-100 focus-within:ring-2 ring-slate-200 transition-all">
                        <Input 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isListening ? "Bolिये, main sun raha hoon..." : "Message likho..."}
                            className="bg-transparent border-none focus-visible:ring-0 font-bold text-slate-900 h-14"
                        />
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50 rounded-full" onClick={shareLocation}>
                            <MapPin className="w-5 h-5" />
                        </Button>
                    </div>

                    <Button 
                        onClick={() => sendMessage(inputText)}
                        className="h-14 w-14 rounded-2xl bg-slate-900 hover:bg-black shadow-xl active:scale-90 transition-all"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </Button>
                </div>
                
                <button className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors">
                    <AlertTriangle className="w-3 h-3" /> Emergency Help
                </button>
            </div>
        </div>
    );
}