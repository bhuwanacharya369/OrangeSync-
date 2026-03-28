// @ts-nocheck
'use client';

import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useDataChannel } from '@livekit/components-react';

export default function WatchTogether() {
  const playerRef = useRef<any>(null);
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); 
  const [playing, setPlaying] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const { send, message } = useDataChannel('watch-sync');

  // Handle incoming remote sync messages
  useEffect(() => {
    if (!message) return;
    try {
      const decoded = new TextDecoder().decode(message.payload);
      const action = JSON.parse(decoded);
      
      if (action.type === 'PLAY') {
         setPlaying(true);
         const curr = playerRef.current?.getCurrentTime() || 0;
         if (Math.abs(curr - action.time) > 1) {
             playerRef.current?.seekTo(action.time);
         }
      } else if (action.type === 'PAUSE') {
         setPlaying(false);
      } else if (action.type === 'URL') {
         setUrl(action.url);
      }
    } catch (e) {
      console.error('Watch sync error:', e);
    }
  }, [message]);

  const handlePlay = () => {
    setPlaying(true);
    const curr = playerRef.current?.getCurrentTime() || 0;
    send(new TextEncoder().encode(JSON.stringify({ type: 'PLAY', time: curr })), { reliable: true });
  };

  const handlePause = () => {
    setPlaying(false);
    send(new TextEncoder().encode(JSON.stringify({ type: 'PAUSE' })), { reliable: true });
  };

  const handleSeek = (seconds: number) => {
    send(new TextEncoder().encode(JSON.stringify({ type: 'PLAY', time: seconds })), { reliable: true });
  };

  const changeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setUrl(inputUrl);
    send(new TextEncoder().encode(JSON.stringify({ type: 'URL', url: inputUrl })), { reliable: true });
    setInputUrl('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-black rounded-2xl shadow-lg border border-neutral-800 overflow-hidden">
      <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex gap-2">
        <form onSubmit={changeUrl} className="flex-1 flex gap-2">
           <input 
             type="url" 
             placeholder="Paste YouTube or MP4 URL to watch together..." 
             value={inputUrl}
             onChange={(e) => setInputUrl(e.target.value)}
             className="flex-1 px-3 py-2 bg-neutral-800 text-orange-500 font-bold placeholder-orange-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
           />
           <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm transition-colors">
             Watch
           </button>
        </form>
      </div>
      <div className="flex-1 relative bg-black">
         {/* @ts-ignore */}
         <ReactPlayer
           ref={playerRef}
           url={url}
           width="100%"
           height="100%"
           playing={playing}
           controls={true}
           onPlay={handlePlay}
           onPause={handlePause}
           style={{ position: 'absolute', top: 0, left: 0 }}
         />
      </div>
    </div>
  );
}
