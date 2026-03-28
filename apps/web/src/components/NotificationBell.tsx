'use client'

import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, PhoneMissed } from 'lucide-react';

function timeAgo(dateString: string) {
   const diff = Date.now() - new Date(dateString).getTime();
   const mins = Math.floor(diff / 60000);
   if (mins < 1) return 'Just now';
   if (mins < 60) return `${mins}m ago`;
   const hrs = Math.floor(mins / 60);
   if (hrs < 24) return `${hrs}h ago`;
   return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
   const [missedCalls, setMissedCalls] = useState<any[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   
   // Handle clicking outside to close
   const menuRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const load = () => {
         const calls = JSON.parse(localStorage.getItem('orangesync_missed_calls') || '[]');
         setMissedCalls(calls);
      };
      load();
      window.addEventListener('orangesync_missed_call_update', load);
      
      const handleClickOutside = (e: MouseEvent) => {
         if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
             setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
          window.removeEventListener('orangesync_missed_call_update', load);
          document.removeEventListener('mousedown', handleClickOutside);
      };
   }, []);

   return (
      <div className="relative" ref={menuRef}>
         <button onClick={() => setIsOpen(!isOpen)} className="relative p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-orange-600">
            <Bell size={22} />
            {missedCalls.length > 0 && (
               <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                  {missedCalls.length}
               </span>
            )}
         </button>

         {isOpen && (
            <div className="absolute right-0 top-14 w-[calc(100vw-3rem)] sm:w-80 max-w-[320px] bg-white rounded-2xl shadow-xl border border-orange-100 z-50 overflow-hidden animate-in slide-in-from-top-2">
               <div className="bg-orange-500 text-white p-4 font-black flex justify-between items-center">
                  <span>Notifications</span>
                  {missedCalls.length > 0 && <button onClick={() => { localStorage.removeItem('orangesync_missed_calls'); setMissedCalls([]); window.dispatchEvent(new Event('orangesync_missed_call_update')); }} className="text-orange-200 hover:text-white text-xs underline">Clear All</button>}
               </div>
               <div className="max-h-80 overflow-y-auto p-2">
                  {missedCalls.length === 0 ? (
                     <p className="text-center text-gray-400 text-sm py-8 font-medium">You're all caught up!</p>
                  ) : (
                     <div className="space-y-1">
                        {missedCalls.map((c, i) => (
                           <div key={i} className="flex gap-3 items-start p-3 bg-orange-50/50 hover:bg-orange-50 rounded-xl transition-colors border border-transparent hover:border-orange-100 group">
                              <div className="mt-1 bg-red-100 text-red-500 p-1.5 rounded-full shadow-inner">
                                 <PhoneMissed size={16} />
                              </div>
                              <div className="flex-1">
                                 <p className="font-bold text-orange-950 text-sm leading-tight text-wrap break-all">Missed Call</p>
                                 <p className="text-orange-700 text-sm font-bold mt-0.5">{c.name}</p>
                                 <p className="text-orange-400 text-[11px] font-mono mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {timeAgo(c.timestamp)}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
