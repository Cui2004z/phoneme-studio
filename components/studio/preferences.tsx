'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { DEFAULTS, type ActivityType, type ActivityConfig } from '@/lib/studio/data';
type Preferences = {
    theme: 'light' | 'dark';
    compact: boolean;
    name: string;
    studentNumber: string;
    videoUrl: string;
};
const defaults: Preferences = { theme: 'light', compact: false, name: 'Samuel Karanja', studentNumber: '22301707', videoUrl: '' };
const Context = createContext<{
    preferences: Preferences;
    update: (value: Partial<Preferences>) => void;
    activities: Record<ActivityType, ActivityConfig>;
    updateActivity: (type: ActivityType, value: Partial<ActivityConfig>) => void;
}>({ preferences: defaults, update: () => { }, activities: DEFAULTS, updateActivity: () => {} });
export function StudioProvider({ children }: {
    children: ReactNode;
}) {
    const [preferences, setPreferences] = useState(defaults);
    const [activities, setActivities] = useState(DEFAULTS);
    function updateActivity(type: ActivityType, value: Partial<ActivityConfig>) {
        setActivities(previous => ({...previous, [type]: {...previous[type], ...value}}));
    }
    const [ready, setReady] = useState(false);
    useEffect(() => { try {
        const saved = document.cookie.split('; ').find(row => row.startsWith('phoneme-preferences='));
        if (saved) {
            const p = JSON.parse(decodeURIComponent(saved.split('=').slice(1).join('=')));
            setPreferences({ theme: p.theme === 'dark' ? 'dark' : 'light', compact: p.compact === true, name: typeof p.name === 'string' && p.name.trim() ? p.name : defaults.name, studentNumber: typeof p.studentNumber === 'string' && p.studentNumber.trim() ? p.studentNumber : defaults.studentNumber, videoUrl: typeof p.videoUrl === 'string' ? p.videoUrl : '' });
        }
    }
    catch { /* Malformed preferences safely fall back to defaults. */ } setReady(true); }, []);
    useEffect(() => { document.documentElement.classList.toggle('dark', preferences.theme === 'dark'); document.documentElement.classList.toggle('compact', preferences.compact); if (ready) {
        document.cookie = `phoneme-preferences=${encodeURIComponent(JSON.stringify(preferences))}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } }, [preferences, ready]);
    function update(value: Partial<Preferences>) { setPreferences(p => ({ ...p, ...value })); }
    return <Context.Provider value={{ preferences, update, activities, updateActivity }}><TooltipProvider delayDuration={180}>{children}<Toaster position="bottom-right" theme={preferences.theme}/></TooltipProvider></Context.Provider>;
}
export function usePreferences() { return useContext(Context); }
