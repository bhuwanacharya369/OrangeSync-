'use client'

import '@livekit/components-styles';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';
import WatchTogether from '@/components/WatchTogether';

export default function CallPage() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room');
  const router = useRouter();
  
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'watch'>('video');

  useEffect(() => {
    if (!room) return;
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${room}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [room]);

  if (!room) return <div className="h-screen bg-neutral-900 text-white flex items-center justify-center">Missing room</div>;
  if (!token) return <div className="h-screen bg-neutral-900 flex items-center justify-center"><div className="animate-spin w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full font-mono"></div></div>;

  return (
    <div className="h-[100dvh] w-full bg-neutral-900 border-t-4 border-orange-500 flex flex-col">
      {/* Top Header / Tab Bar */}
      <div className="h-14 bg-neutral-950 flex items-center px-4 justify-between border-b border-neutral-800">
        <div className="text-orange-500 font-black tracking-widest text-lg">OrangeSync</div>
        <div className="flex bg-neutral-800 rounded-lg p-1">
           <button onClick={() => setActiveTab('video')} className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${activeTab === 'video' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Grid</button>
           <button onClick={() => setActiveTab('whiteboard')} className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${activeTab === 'whiteboard' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Whiteboard</button>
           <button onClick={() => setActiveTab('watch')} className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${activeTab === 'watch' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Watch Together</button>
        </div>
        <div className="text-neutral-500 text-xs font-mono bg-neutral-800 px-3 py-1 rounded-full hidden sm:block">ROOM: {room}</div>
      </div>

      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://mock.livekit.cloud'}
        data-lk-theme="default"
        className="flex-1 flex flex-col min-h-0"
        onDisconnected={() => router.push('/dashboard')}
      >
        <div className="flex-1 flex overflow-hidden p-2 gap-2">
          {/* Main Content Area */}
          <div className={`flex-1 ${activeTab === 'video' ? 'block' : 'hidden md:block md:w-2/3 lg:w-3/4'}`}>
            {activeTab === 'whiteboard' ? (
               <Whiteboard />
            ) : activeTab === 'watch' ? (
               <WatchTogether />
            ) : (
               <MyVideoConference />
            )}
          </div>
          
          {/* Side Panel for Video when a tool is active */}
          {activeTab !== 'video' && (
             <div className="w-1/3 lg:w-1/4 border-l border-neutral-800 hidden md:block">
                <MyVideoConference />
             </div>
          )}
        </div>

        <RoomAudioRenderer />
        <ControlBar 
           controls={{ screenShare: true, chat: false, leave: true, camera: true, microphone: true }}
           className="bg-neutral-800/80 backdrop-blur-md border-t border-neutral-700/50"
        />
      </LiveKitRoom>
    </div>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <div className="h-full w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-neutral-800">
      <GridLayout tracks={tracks} style={{ height: '100%' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}
