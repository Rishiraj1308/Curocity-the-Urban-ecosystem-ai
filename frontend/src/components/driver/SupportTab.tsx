'use client';

import React from 'react';
import { Phone, MessageSquare, ChevronRight, FileQuestion, ShieldAlert } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function SupportTab() {
  return (
    <div className="p-6 pb-24 space-y-8 font-sans bg-slate-50 min-h-full">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Help & Support</h1>
        <p className="text-slate-500 text-sm">How can we help you today, Captain?</p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 shadow-sm">
            <Phone className="w-6 h-6" />
            <span className="font-bold">Call Us</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 bg-white border-slate-200 hover:bg-green-50 hover:border-green-200 hover:text-green-600 shadow-sm">
            <MessageSquare className="w-6 h-6" />
            <span className="font-bold">Chat Support</span>
        </Button>
      </div>

      {/* Recent Tickets */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Tickets</h3>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
                <p className="text-sm font-bold text-slate-900">Fare Dispute - Ride #1234</p>
                <p className="text-xs text-orange-500 font-bold mt-1">In Progress</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Common Questions</h3>
        <Accordion type="single" collapsible className="w-full space-y-2">
            <FAQItem value="item-1" q="How are earnings calculated?" a="Earnings are calculated based on base fare + distance + time. Incentives are added separately." />
            <FAQItem value="item-2" q="When will I get my payment?" a="Payments are processed every Wednesday for the previous week." />
            <FAQItem value="item-3" q="How to report a rude rider?" a="Go to Ride History > Select Ride > Report Issue. Safety is our priority." />
            <FAQItem value="item-4" q="Why is my account blocked?" a="Accounts are blocked for low ratings or document expiry. Check your email for details." />
        </Accordion>
      </div>
      
      <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-bold text-red-700">Safety Center</p>
            <p className="text-xs text-red-600 mt-1">For emergencies during a ride, use the SOS button on the ride screen.</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ value, q, a }: any) {
    return (
        <AccordionItem value={value} className="bg-white border border-slate-200 rounded-xl px-4 data-[state=open]:border-slate-300">
            <AccordionTrigger className="text-sm font-bold text-slate-900 hover:no-underline">{q}</AccordionTrigger>
            <AccordionContent className="text-slate-500 text-sm">
                {a}
            </AccordionContent>
        </AccordionItem>
    )
}