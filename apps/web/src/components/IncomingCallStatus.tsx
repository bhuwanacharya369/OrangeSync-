'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Phone, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function IncomingCallListener({ userSyncId }: { userSyncId: string }) {
   const [incomingCall, setIncomingCall] = useState<{ callerSyncId: string, callerName: string } | null>(null);
   const [isRinging, setIsRinging] = useState(false);
   const router = useRouter();

   useEffect(() => {
      const supabase = createClient();
      
      const channel = supabase.channel('system:ringing');
      
      channel.on('broadcast', { event: 'call' }, (payload) => {
          if (payload.payload.to === userSyncId) {
             setIncomingCall({ 
                 callerSyncId: payload.payload.from, 
                 callerName: payload.payload.fromName 
             });
             setIsRinging(true);
             
             // Play generic HTML5 audio beacon (simulate WhatsApp ping)
             try {
                const ctx = new window.AudioContext();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 830.6;
                o.connect(g);
                g.connect(ctx.destination);
                o.start(0);
                g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
             } catch(e) {}
          }
      }).subscribe();

      return () => { supabase.removeChannel(channel); }
   }, [userSyncId]);

   if (!isRinging || !incomingCall) return null;

   return (
      <div className="fixed bottom-6 right-6 bg-white p-6 rounded-3xl shadow-2xl border-2 border-orange-500 z-50 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 animate-pulse">
               <Phone size={20} fill="currentColor" />
            </div>
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest">Incoming Call</h3>
         </div>
         
         <p className="text-orange-950 font-black text-2xl mb-6">{incomingCall.callerName}</p>
         
         <div className="flex gap-3">
             <button onClick={() => setIsRinging(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors">
                 <PhoneOff size={18} /> Decline
             </button>
             <button onClick={() => {
                 setIsRinging(false);
                 // Join the caller's room instantly
                 router.push(`/dashboard/call?room=${incomingCall.callerSyncId}`);
             }} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-green-500/30 transition-all active:scale-95">
                 <Phone size={18} fill="currentColor" /> Accept
             </button>
         </div>
      </div>
   );
}
