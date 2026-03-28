'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { ArrowLeft, User, Moon, Sun, Palette, Save, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { theme, setTheme, mode, toggleMode } = useTheme();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        if (name) {
            await supabase.auth.updateUser({ data: { full_name: name } });
            alert("Profile updated successfully!");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[100dvh] bg-orange-50 p-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <Link href="/dashboard" className="inline-flex flex-row items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <h1 className="text-4xl font-black text-orange-950 flex items-center gap-3">
                    <User className="text-orange-500" size={36} /> My Account
                </h1>

                {/* Profile Data */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex flex-col gap-6">
                    <div>
                        <h2 className="text-lg font-bold text-orange-900 mb-2">Display Name</h2>
                        <input 
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="Update your name..."
                            className="w-full bg-orange-50 border border-orange-200 p-4 rounded-xl text-orange-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none" 
                        />
                    </div>
                    
                    <div>
                        <h2 className="text-lg font-bold text-orange-900 mb-2">Profile Avatar</h2>
                        <div className="flex items-center gap-4 bg-orange-50 p-6 rounded-xl border border-orange-200 border-dashed">
                            <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center text-orange-500 font-black text-xl">
                                ?
                            </div>
                            <button className="flex items-center gap-2 bg-white border border-orange-200 px-4 py-2 hover:bg-orange-100 rounded-lg text-sm font-bold text-orange-700 transition-colors cursor-pointer opacity-50 cursor-not-allowed">
                                <Upload size={16} /> Image Uploads require SQL Setup
                            </button>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 mt-4 mt-auto">
                        <Save size={20}/> {loading ? 'Saving...' : 'Save Profile Config'}
                    </button>
                </div>

                {/* Theme Controller */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex flex-col gap-6">
                    <h2 className="text-2xl font-black text-orange-950 flex items-center gap-3">
                        <Palette className="text-orange-500" size={28} /> Appearance
                    </h2>
                    
                    <div>
                        <h3 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4 flex items-center justify-between">
                            Color Palette
                        </h3>
                        <div className="flex gap-4">
                            {(['orange', 'blue', 'purple', 'green'] as const).map(t => (
                                <button key={t} onClick={() => setTheme(t)} className={`w-12 h-12 rounded-full cursor-pointer transition-transform hover:scale-110 border-4 border-white shadow-md flex items-center justify-center ${theme === t ? 'ring-4 ring-orange-400 scale-110' : ''}`}
                                    style={{ background: t === 'orange' ? '#f97316' : t === 'blue' ? '#3b82f6' : t === 'green' ? '#22c55e' : '#a855f7' }}>
                                    {theme === t && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-orange-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-orange-900">Dark Mode</h3>
                            <p className="text-orange-600/80 text-sm font-medium">Comfortable layout for late-night hacking.</p>
                        </div>
                        <button onClick={toggleMode} className={`relative w-16 h-8 rounded-full transition-colors flex items-center px-1 border-2 border-transparent ${mode === 'dark' ? 'bg-orange-900' : 'bg-orange-300'}`}>
                            <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform ${mode === 'dark' ? 'translate-x-8' : 'translate-x-0'}`}>
                                {mode === 'dark' ? <Moon size={12} className="text-orange-900" /> : <Sun size={12} className="text-orange-500" />}
                            </div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
