'use client'

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Phone, PhoneOff, PhoneMissed } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function IncomingCallListener({ userSyncId }: { userSyncId: string }) {
   const [incomingCall, setIncomingCall] = useState<{ callerSyncId: string, callerName: string, dbCallId: string } | null>(null);
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
         if (Notification.permission === 'default') {
             Notification.requestPermission().then(setPermissionStatus);
         }
      }

      const supabase = createClient();
      let lastCallId = '';

      const checkCallsLoop = async () => {
          if (!userSyncId) return;
          try {
              const { data, error } = await supabase
                 .from('call_logs')
                 .select('*')
                 .eq('target_id', userSyncId)
                 .eq('status', 'ringing')
                 .order('created_at', { ascending: false })
                 .limit(1);

              if (error) throw error;
              if (data && data.length > 0) {
                 const call = data[0];
                 
                 // If the call is older than 30 seconds, it is definitively expired!
                 const callTime = new Date(call.created_at).getTime();
                 const now = new Date().getTime();
                 if (now - callTime > 30000) return;
                 
                 // Stop double-ringing for the same exact call insert
                 if (call.id === lastCallId) return;
                 lastCallId = call.id;

                 setIncomingCall({ 
                     callerSyncId: call.caller_id, 
                     callerName: call.caller_name,
                     dbCallId: call.id
                 });
                 setIsRinging(true);
                 
                 // Immediately log it locally as a Missed Call! 
                 // (We will delete it from localStorage cleanly if they click "Accept")
                 const historyTxt = localStorage.getItem('orangesync_missed_calls') || '[]';
                 const history = JSON.parse(historyTxt);
                 history.unshift({
                     name: call.caller_name,
                     syncId: call.caller_id,
                     timestamp: new Date().toISOString()
                 });
                 localStorage.setItem('orangesync_missed_calls', JSON.stringify(history.slice(0, 10)));
                 window.dispatchEvent(new Event('orangesync_missed_call_update'));

                 // Fire Audio Beep 🔊
                 try {
                    const ctx = new window.AudioContext();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine'; o.frequency.value = 830.6;
                    o.connect(g); g.connect(ctx.destination);
                    o.start(0); g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
                 } catch(e) {}

                 // Trigger physical OS Banner 🖥️
                 if ('Notification' in window && Notification.permission === 'granted') {
                    const n = new Notification('🎥 OrangeSync Incoming Call', {
                       body: `${call.caller_name} is calling you! Click here to answer.`,
                       requireInteraction: true
                    });
                    
                    n.onclick = () => {
                        window.focus();
                        clearCallSafely(call.id, 'answered');
                        router.push(`/dashboard/call?room=${call.caller_id}`);
                    };
                    osNotificationRef.current = n;
                 }

                 // Safety auto-decline timeout in 30 seconds
                 if (timeoutRef.current) clearTimeout(timeoutRef.current);
                 timeoutRef.current = setTimeout(() => {
                     clearCallSafely(call.id, 'missed');
                 }, 30000);
              }
          } catch(e) {}
      };

      const pollInterval = setInterval(checkCallsLoop, 3000);
      checkCallsLoop(); // Fire first check instantly!

      return () => { clearInterval(pollInterval); }
   }, [userSyncId, router]);

   const clearCallSafely = async (callId: string, finalStatus: string) => {
       setIsRinging(false);
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       if (osNotificationRef.current) {
           osNotificationRef.current.close();
           osNotificationRef.current = null;
       }
       
       // If accepted, pop it securely OUT of the Unread Notifications log!
       if (finalStatus === 'answered') {
           const historyTxt = localStorage.getItem('orangesync_missed_calls') || '[]';
           let history = JSON.parse(historyTxt);
           history.shift(); 
           localStorage.setItem('orangesync_missed_calls', JSON.stringify(history));
           window.dispatchEvent(new Event('orangesync_missed_call_update'));
       }

       // Mark it explicitly dead natively inside Postgres
       const supabase = createClient();
       await supabase.from('call_logs').update({ status: finalStatus }).eq('id', callId);
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

   // DIAGNOSTIC LOOPBACK PING
   const triggerSelfPing = async () => {
       const supabase = createClient();
       await supabase.from('call_logs').insert([{
           caller_id: userSyncId,
           caller_name: 'Diagnostic Self Ping',
           target_id: userSyncId,
           status: 'ringing'
       }]);
   };

   return (
       <>
         {/* Manual Override & Debug Banner */}
         {!isRinging && (
             <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 max-w-sm">
                 {permissionStatus === 'default' && (
                     <div className="bg-orange-50 p-4 rounded-2xl shadow-xl border border-orange-200">
                         <p className="text-orange-800 text-sm font-bold mb-2">Never miss a call!</p>
                         <button onClick={requestManualPermissions} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors">
                             🔔 Enable Desktop Alerts
                         </button>
                     </div>
                 )}
                 <button onClick={triggerSelfPing} className="bg-neutral-800 hover:bg-neutral-900 text-white text-[10px] font-mono py-1.5 px-3 rounded-lg opacity-50 hover:opacity-100 transition-opacity self-end shadow-sm">
                     ⚡ Test Ring (Self-Ping)
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
                   <button onClick={() => incomingCall && clearCallSafely(incomingCall.dbCallId, 'declined')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors">
                       <PhoneOff size={18} /> Decline
                   </button>
                   <button onClick={() => {
                       if (incomingCall) {
                           clearCallSafely(incomingCall.dbCallId, 'answered');
                           router.push(`/dashboard/call?room=${incomingCall.callerSyncId}`);
                       }
                   }} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-green-500/30 transition-all active:scale-95">
                       <Phone size={18} fill="currentColor" /> Accept
                   </button>
               </div>
            </div>
         )}
       </>
   );
}
