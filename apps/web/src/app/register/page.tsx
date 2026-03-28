import Link from 'next/link';
import { signup } from '@/app/auth/actions';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="bg-white/80 backdrop-blur-md p-10 mt-10 rounded-3xl shadow-xl w-full max-w-md border border-white/40">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-orange-600 tracking-tight">Join OrangeSync</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Create your unique ID today.</p>
        </div>
        
        {params.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-sm font-semibold text-center border border-red-200">
            {params.error}
          </div>
        )}

        <form className="space-y-4" action={signup}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              placeholder="John Doe" 
              required
              className="w-full px-4 py-3 rounded-xl border border-orange-200 text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="you@example.com" 
              required
              className="w-full px-4 py-3 rounded-xl border border-orange-200 text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              required
              className="w-full px-4 py-3 rounded-xl border border-orange-200 text-orange-600 font-bold placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-600/30 transition-all active:scale-[0.98] mt-4"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
