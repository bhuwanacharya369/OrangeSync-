'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useDataChannel } from '@livekit/components-react';
import 'tldraw/tldraw.css';

// Dynamic import prevents Next.js SSR from crashing on canvas/window objects
const Tldraw = dynamic(async () => {
    const mod = await import('tldraw');
    return mod.Tldraw;
}, { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-orange-50 text-orange-500 font-bold uppercase tracking-widest animate-pulse min-h-[500px]">Initializing Professional Board...</div> });

export default function Whiteboard() {
  const [editor, setEditor] = useState<any>(null);
  const { send, message } = useDataChannel('tldraw-sync');
  const preventLoop = useRef(false);

  // Setup broadcasting local drawing events to the LiveKit Room
  useEffect(() => {
     if (!editor) return;
     
     const unsubscribe = editor.store.listen(
       (update: any) => {
         // Only broadcast if the user actually drew it
         if (update.source !== 'user' || preventLoop.current) return;
         try {
           const payload = {
             added: update.changes.added,
             updated: update.changes.updated,
             removed: update.changes.removed,
           };
           send(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true });
         } catch (e) { 
           console.error("Sync broadcast error", e);
         }
       },
       { scope: 'document' }
     );
     
     return () => unsubscribe();
  }, [editor, send]);

  // Setup receiving remote WebRTC data
  useEffect(() => {
     if (!message || !editor) return;
     try {
        const changes = JSON.parse(new TextDecoder().decode(message.payload));
        preventLoop.current = true; // Lock local broadcast
        
        editor.store.mergeRemoteChanges(() => {
           if (changes.added && Object.keys(changes.added).length > 0) {
               editor.store.put(Object.values(changes.added));
           }
           if (changes.updated && Object.keys(changes.updated).length > 0) {
              const updates = Object.values(changes.updated).map((u: any) => u[1]); 
              editor.store.put(updates);
           }
           if (changes.removed && Object.keys(changes.removed).length > 0) {
               editor.store.remove(Object.keys(changes.removed));
           }
        });
        
        preventLoop.current = false; // Unlock
     } catch (e) {
        preventLoop.current = false;
        console.error('Incoming sync error', e);
     }
  }, [message, editor]);

  return (
    <div 
      className="flex-1 flex flex-col w-full h-full rounded-2xl shadow-lg border border-orange-200 overflow-hidden relative z-10 tldraw-container-override bg-white"
    >
       <Tldraw 
          onMount={(ed) => setEditor(ed)}
          inferDarkMode={false}
       />
    </div>
  );
}
