'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeColor = 'orange' | 'blue' | 'purple' | 'green';
type ColorMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeColor;
    setTheme: (t: ThemeColor) => void;
    mode: ColorMode;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'orange',
    setTheme: () => {},
    mode: 'light',
    toggleMode: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeColor>('orange');
    const [mode, setModeState] = useState<ColorMode>('light');

    // Startup hydration
    useEffect(() => {
        const savedTheme = (localStorage.getItem('osync_theme') as ThemeColor) || 'orange';
        const savedMode = (localStorage.getItem('osync_mode') as ColorMode) || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        setTheme(savedTheme);
        setMode(savedMode);
    }, []);

    const setTheme = (t: ThemeColor) => {
        setThemeState(t);
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('osync_theme', t);
    };

    const setMode = (m: ColorMode) => {
        setModeState(m);
        document.documentElement.setAttribute('data-mode', m);
        
        // Tailwind v4 uses standard dark mode overriding via CSS or body class
        if (m === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        
        localStorage.setItem('osync_mode', m);
    };

    const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ theme, setTheme, mode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
