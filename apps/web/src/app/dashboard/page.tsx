import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link';
import QRCode from 'react-qr-code';
import FriendsList from './FriendsList';
import IncomingCallListener from '@/components/IncomingCallStatus';
import NotificationBell from '@/components/NotificationBell';
import { Settings } from 'lucide-react';
import os from 'os';

function getLocalCompanionUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return `http://${net.address}:3000/dashboard`;
        }
      }
    }
  } catch(e) {}
  return 'http://localhost:3000/dashboard';
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const friends = user.user_metadata?.friends || [];

  return (
    <div className="min-h-screen bg-orange-50 p-4 md:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-orange-100 gap-4 transition-colors">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-orange-950">
              Welcome back, <Link href="/dashboard/profile" className="text-orange-500 hover:text-orange-600 underline decoration-orange-300 decoration-2 underline-offset-4 cursor-pointer" title="Config Profile">{user.user_metadata?.full_name || 'User'}</Link>! 👋
            </h1>
            <p className="text-orange-600/80 font-medium mt-1">Ready to sync up and collaborate?</p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/dashboard/profile" className="p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-orange-600" title="Profile & Settings">
                <Settings size={22} />
            </Link>
            <NotificationBell />
            <form action="/auth/signout" method="post">
              <button className="px-6 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold rounded-xl transition-colors shadow-sm">
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Main Grid Floor */}
        <div className="flex flex-col lg:flex-row gap-6">
           
           {/* Left Col: Profile & Quick Join */}
           <div className="w-full lg:w-1/3 flex flex-col gap-6">
             {/* Profile Card */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 text-center">
                <p className="text-orange-500 font-bold tracking-wide uppercase text-sm mb-4">My Unique Sync ID</p>
                <div className="text-3xl font-black text-orange-600 tracking-wider">
                  {user.user_metadata?.app_unique_id || 'SYNC-XXXXXX'}
                </div>

                <div className="mt-6 flex justify-center bg-white p-4 rounded-xl border-2 border-orange-100 shadow-sm w-max mx-auto">
                  <QRCode 
                    value={user.user_metadata?.app_unique_id || 'SYNC-XXXXXX'} 
                    size={130} 
                    fgColor="#EA580C"
                    bgColor="#ffffff"
                  />
                </div>

                <p className="text-xs text-orange-600 mt-4 font-medium uppercase tracking-widest">Share this ID with friends!</p>
             </div>

             {/* Join Room Card */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                <h2 className="text-xl font-black text-orange-950 mb-4">Quick Join Room</h2>
                <form action="/dashboard/call" method="get">
                  <div className="flex flex-col gap-3">
                    <input 
                      name="room"
                      type="text" 
                      placeholder="e.g. SYNC-ABC123" 
                      required
                      className="w-full px-4 py-4 rounded-xl border border-orange-200 text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all uppercase font-mono text-lg bg-orange-50"
                    />
                    <button 
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
                    >
                      Join Secure Video Call
                    </button>
                  </div>
                </form>
             </div>

             {/* Companion Mode Card */}
             <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-6 shadow-sm border border-orange-300 text-center">
                <h2 className="text-xl font-black text-white mb-2">Tablet Companion Mode</h2>
                <p className="text-sm text-orange-50 font-medium mb-4">Scan this on your Android Tablet or iPad to use it as a remote drawing pad!</p>
                <div className="bg-white p-3 rounded-xl w-max mx-auto border-2 border-orange-100 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                  <QRCode 
                    value={getLocalCompanionUrl()} 
                    size={110} 
                    fgColor="#EA580C"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-[10px] text-white mt-4 font-mono bg-black/20 py-1.5 px-3 rounded-lg mx-auto w-full max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">{getLocalCompanionUrl()}</p>
             </div>

           </div>

           {/* Right Col: Interactive Friends List */}
           <div className="w-full lg:w-2/3 flex">
              <FriendsList 
                friends={friends} 
                mySyncId={user.user_metadata?.app_unique_id || ''}
                myName={user.user_metadata?.full_name || 'User'}
              />
           </div>

        </div>
      </div>
      
      {/* Global Call Receiver System */}
      <IncomingCallListener userSyncId={user.user_metadata?.app_unique_id || ''} />
    </div>
  )
}
