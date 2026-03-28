'use client';

import { useState, useEffect } from 'react';
import { addContact, removeContact } from './actions';
import { UserPlus, Phone, Trash2, PhoneMissed, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function FriendsList({ friends = [], mySyncId, myName }: { friends: any[], mySyncId: string, myName: string }) {
  const [name, setName] = useState('');
  const [syncId, setSyncId] = useState('');
  const [loading, setLoading] = useState(false);
  const [missedCalls, setMissedCalls] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
     const loadMissed = () => {
         const calls = JSON.parse(localStorage.getItem('orangesync_missed_calls') || '[]');
         setMissedCalls(calls);
     };
     loadMissed();
     window.addEventListener('orangesync_missed_call_update', loadMissed);
     return () => window.removeEventListener('orangesync_missed_call_update', loadMissed);
  }, []);

  const clearMissedCalls = () => {
      localStorage.removeItem('orangesync_missed_calls');
      setMissedCalls([]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addContact(name, syncId);
      setName('');
      setSyncId('');
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const startCall = async (friendTarget: any) => {
      // 1. Send the Ring Broadcast over Supabase Realtime
      const supabase = createClient();
      const channel = supabase.channel('system:ringing');
      
      channel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
            await channel.send({
                type: 'broadcast',
                event: 'call',
                payload: { to: friendTarget.syncId, from: mySyncId, fromName: myName }
            });
            
            // 2. Add a slight delay before redirecting to ensure the WebSocket 
            // completely flushes the Ring packet before the component unmounts
            setTimeout(() => {
               router.push(`/dashboard/call?room=${mySyncId}`);
            }, 600);
         }
      });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 flex-1">
      <h2 className="text-xl font-black tracking-wide text-orange-600 mb-6 flex items-center gap-2">
        <UserPlus size={24} /> My Contacts
      </h2>
      
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-8">
        <input 
          placeholder="Contact Name (e.g. Alice)" 
          value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-orange-200 rounded-xl text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50"
          required
        />
        <div className="flex gap-2">
            <input 
            placeholder="SYNC ID" 
            value={syncId} onChange={(e) => setSyncId(e.target.value)}
            className="flex-1 px-4 py-3 border border-orange-200 rounded-xl text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase bg-orange-50"
            required
            />
            <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm shadow-orange-500/30">
            {loading ? '...' : 'Add'}
            </button>
        </div>
      </form>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {friends.length === 0 ? (
           <p className="text-orange-400 text-sm font-medium text-center py-6 bg-orange-50 rounded-xl border border-orange-100 border-dashed">No contacts added yet.</p>
        ) : (
          friends.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100 transition-all hover:bg-orange-100/50">
               <div>
                  <p className="font-bold text-orange-700 text-lg">{f.name}</p>
                  <p className="text-xs text-orange-500 font-mono tracking-wider">{f.syncId}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => startCall(f)} className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-sm shadow-green-500/30 active:scale-95" title="Video Call">
                   <Phone size={18} fill="currentColor" />
                 </button>
                 <button onClick={() => removeContact(f.syncId)} className="p-3 bg-white hover:bg-red-50 text-red-500 border border-red-100 rounded-xl transition-all active:scale-95" title="Remove">
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>
          ))
        )}
      </div>

      {missedCalls.length > 0 && (
          <div className="mt-8 pt-6 border-t border-orange-100">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black tracking-wide text-red-500 flex items-center gap-2">
                   <PhoneMissed size={20} /> Missed Calls
                </h3>
                <button onClick={clearMissedCalls} className="text-xs text-red-400 hover:text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                   Clear <X size={12} />
                </button>
             </div>
             
             <div className="space-y-2">
                {missedCalls.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                       <div className="flex-1">
                          <p className="font-bold text-red-700 text-sm">{m.name}</p>
                          <p className="text-xs text-red-400 font-mono tracking-wider">{m.syncId}</p>
                       </div>
                       <button onClick={() => startCall(m)} className="bg-white text-green-500 hover:bg-green-500 hover:text-white border border-green-200 p-2 rounded-lg transition-colors" title="Call Back">
                          <Phone size={16} fill="currentColor" />
                       </button>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
}
