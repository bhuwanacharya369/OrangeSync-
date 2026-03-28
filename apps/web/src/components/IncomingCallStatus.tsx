'use client'

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Phone, PhoneOff, PhoneMissed } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function IncomingCallListener({ userSyncId }: { userSyncId: string }) {
   const [incomingCall, setIncomingCall] = useState<{ callerSyncId: string, callerName: string } | null>(null);
   const [isRinging, setIsRinging] = useState(false);
   const [permissionStatus, setPermissionStatus] = useState<string>('granted');
   const router = useRouter();
   
   // Keep native OS Web Notification and Timeout in refs so we can easily dismiss them safely
   const osNotificationRef = useRef<Notification | null>(null);
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      // 1. Immediately request OS Notification permissions safely
      if (typeof window !== 'undefined' && 'Notification' in window) {
         setPermissionStatus(Notification.permission);
         // Autoplay aggressive prompt if possible, though browsers may block it:
         if (Notification.permission === 'default') {
             Notification.requestPermission().then(setPermissionStatus);
         }
      }

      const supabase = createClient();
      const channel = supabase.channel('system:ringing');
      
      channel.on('broadcast', { event: 'call' }, (payload) => {
          if (payload.payload.to === userSyncId) {
             setIncomingCall({ 
                 callerSyncId: payload.payload.from, 
                 callerName: payload.payload.fromName 
             });
             setIsRinging(true);
             
             // 2. Play Audio Node Beep
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

             // 3. Immediately trigger OS Desktop Notification
             if ('Notification' in window && Notification.permission === 'granted') {
                const n = new Notification('🎥 OrangeSync Incoming Call', {
                   body: `${payload.payload.fromName} is calling you! Click here to answer.`,
                   icon: '/favicon.ico', // Will use the browser default or site icon
                   requireInteraction: true // Keeps the banner on screen until acted upon
                });
                
                n.onclick = () => {
                    window.focus(); // Jump to this browser tab immediately
                    clearCallSafely();
                    router.push(`/dashboard/call?room=${payload.payload.from}`);
                };
                osNotificationRef.current = n;
             }

             // 4. Start the 30-second Missed Call countdown
             if (timeoutRef.current) clearTimeout(timeoutRef.current);
             timeoutRef.current = setTimeout(() => {
                 // The call was MISSED!
                 clearCallSafely();
                 
                 // Save to Local DB History explicitly
                 const historyTxt = localStorage.getItem('orangesync_missed_calls') || '[]';
                 const history = JSON.parse(historyTxt);
                 
                 history.unshift({
                     name: payload.payload.fromName,
                     syncId: payload.payload.from,
                     timestamp: new Date().toISOString()
                 });
                 
                 // Keep only last 10 missed calls
                 localStorage.setItem('orangesync_missed_calls', JSON.stringify(history.slice(0, 10)));
                 
                 // Alert FriendsList to redraw itself
                 window.dispatchEvent(new Event('orangesync_missed_call_update'));
                 
             }, 30000);
          }
      }).subscribe();

      return () => { supabase.removeChannel(channel); }
   }, [userSyncId, router]);

   const clearCallSafely = () => {
       setIsRinging(false);
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       if (osNotificationRef.current) {
           osNotificationRef.current.close();
           osNotificationRef.current = null;
       }
   };

   // Request explicit user gesture override if browser blocked the hook silent attempt
   const requestManualPermissions = () => {
       Notification.requestPermission().then(status => {
           setPermissionStatus(status);
           if (status === 'granted') {
               new Notification("Notifications Enabled!", { body: "OrangeSync will now alert you instantly when a friend starts a room." });
           }
       });
   };

   return (
       <>
         {/* Manual Override Prompt Banner */}
         {permissionStatus === 'default' && !isRinging && (
             <div className="fixed bottom-6 right-6 bg-orange-50 p-4 rounded-2xl shadow-xl border border-orange-200 z-40 max-w-sm flex flex-col gap-2">
                 <p className="text-orange-800 text-sm font-bold">Never miss a call!</p>
                 <button onClick={requestManualPermissions} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors">
                     🔔 Enable Desktop Alerts
                 </button>
             </div>
         )}
         
         {/* Incoming Call Ringing Box */}
         {isRinging && incomingCall && (
            <div className="fixed bottom-6 right-6 bg-white p-6 rounded-3xl shadow-2xl border-2 border-orange-500 z-50 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 animate-pulse">
                     <Phone size={20} fill="currentColor" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-500 uppercase tracking-widest">Incoming Call</h3>
               </div>
               
               <p className="text-orange-950 font-black text-2xl mb-6">{incomingCall.callerName}</p>
               
               <div className="flex gap-3">
                   <button onClick={() => clearCallSafely()} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors">
                       <PhoneOff size={18} /> Decline
                   </button>
                   <button onClick={() => {
                       clearCallSafely();
                       router.push(`/dashboard/call?room=${incomingCall.callerSyncId}`);
                   }} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-green-500/30 transition-all active:scale-95">
                       <Phone size={18} fill="currentColor" /> Accept
                   </button>
               </div>
            </div>
         )}
       </>
   );
}
