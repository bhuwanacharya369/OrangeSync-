import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-orange-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-8">
        <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">OrangeSync</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed font-medium">
          The ultimate cross-platform communication hub. Video calls, watch together, share PDFs, and collaborate on a live whiteboard. End-to-end encrypted and stunningly fast.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-6">
          <Link href="/register" className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-600/20 transition-all hover:-translate-y-1">
            Get Started Free
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white text-orange-600 font-bold border-2 border-orange-100 hover:border-orange-200 hover:bg-orange-50 rounded-2xl transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
