'use client'

import '@livekit/components-styles';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useLocalParticipant,
} from '@livekit/components-react';
import { BackgroundProcessor } from '@livekit/track-processors';
import { Track } from 'livekit-client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';
import WatchTogether from '@/components/WatchTogether';
import QRCode from 'react-qr-code';
import os from 'os';
import { Smartphone, X } from 'lucide-react';

function getLocalCompanionUrl() {
  if (typeof window !== 'undefined') {
      return `${window.location.origin}/dashboard`;
  }
  return 'https://orange-sync-web.vercel.app/dashboard';
}

function VideoEffectsToolbar() {
    const { localParticipant } = useLocalParticipant();
    const [isBlurred, setIsBlurred] = useState(false);
    
    const toggleBlur = async () => {
        const trackPub = localParticipant?.getTrackPublication(Track.Source.Camera);
        if (!trackPub || !trackPub.videoTrack) {
            alert("⚠️ Please turn on your camera first using the Video icon at the bottom of the screen!");
            return;
        }
        
        try {
            if (!isBlurred) {
                const processor = BackgroundProcessor({ mode: 'background-blur', blurRadius: 15 });
                await trackPub.videoTrack.setProcessor(processor);
                setIsBlurred(true);
            } else {
                await trackPub.videoTrack.stopProcessor();
                setIsBlurred(false);
            }
        } catch (e) {
            console.error("Blur Error:", e);
        }
    };
    
    return (
        <button onClick={toggleBlur} className={`px-3 py-1.5 flex items-center gap-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isBlurred ? 'bg-orange-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-600'}`} title="Background Blur">
            {isBlurred ? '☁️ Blur ON' : '☁️ Blur OFF'}
        </button>
    );
}

function CallPageContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room');
  const router = useRouter();
  
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'watch'>('video');
  const [showQRModal, setShowQRModal] = useState(false);

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
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://mock.livekit.cloud'}
      data-lk-theme="default"
      className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col"
      onDisconnected={() => router.push('/dashboard')}
    >
      {/* Top Header / Tab Bar */}
      <div className="h-14 bg-neutral-950 flex items-center px-4 justify-between border-b border-neutral-800">
        <div className="text-orange-500 font-black tracking-widest text-lg">OrangeSync</div>
        <div className="flex bg-neutral-800 rounded-lg p-1 overflow-x-auto hide-scrollbar sm:overflow-visible max-w-[50vw] sm:max-w-none">
           <button onClick={() => setActiveTab('video')} className={`px-4 py-1 flex-shrink-0 rounded-md text-sm font-bold transition-colors ${activeTab === 'video' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Grid</button>
           <button onClick={() => setActiveTab('whiteboard')} className={`px-4 py-1 flex-shrink-0 rounded-md text-sm font-bold transition-colors ${activeTab === 'whiteboard' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Whiteboard</button>
           <button onClick={() => setActiveTab('watch')} className={`px-4 py-1 flex-shrink-0 rounded-md text-sm font-bold transition-colors ${activeTab === 'watch' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}>Watch Together</button>
        </div>
        
        <div className="flex items-center gap-3">
            <VideoEffectsToolbar />
            <button onClick={() => setShowQRModal(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-orange-600/20">
                <Smartphone size={14} /> <span className="hidden sm:inline">Link Tablet</span>
            </button>
            <div className="text-neutral-500 text-xs font-mono bg-neutral-800 px-3 py-1.5 rounded-lg hidden lg:block border border-neutral-700 shadow-inner">ROOM: {room}</div>
        </div>
      </div>

      {/* Mid-Call QR Companion Modal */}
      {showQRModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-3xl max-w-sm w-full text-center relative animate-in zoom-in-95 duration-200 shadow-2xl">
                  <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors bg-neutral-800 p-2 rounded-full">
                      <X size={16} />
                  </button>
                  <h2 className="text-2xl font-black text-white mb-2">Tablet Mode</h2>
                  <p className="text-neutral-400 text-sm mb-6">Scan with your iPad or Android Tablet camera to instantly join this exact room as a remote drawing pad!</p>
                  
                  <div className="bg-white p-4 rounded-2xl w-max mx-auto shadow-xl ring-4 ring-orange-500/20">
                      <QRCode 
                        value={`${getLocalCompanionUrl()}/call?room=${room}`} 
                        size={180} 
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0">
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
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-neutral-900 flex items-center justify-center"><div className="animate-spin w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>}>
      <CallPageContent />
    </Suspense>
  )
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
    <div className="h-full w-full bg-neutral-950 overflow-hidden relative">
      <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}
