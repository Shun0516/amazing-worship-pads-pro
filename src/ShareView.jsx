import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import SharedSetlistLiveMode from './SharedSetlistLiveMode';
import { Loader2 } from 'lucide-react';

export default function ShareView() {
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSharedSetlist() {
      // Extract the slug from the URL (e.g., /share/sunday-service-abc1 -> sunday-service-abc1)
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];

      if (!slug || slug === 'share') {
        setError("Invalid or missing share link.");
        setLoading(false);
        return;
      }

      try {
        // Create a timeout promise to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection timed out. Please check your internet.")), 6000)
        );

        const fetchPromise = supabase
          .from('shared_setlists')
          .select('payload')
          .eq('slug', slug)
          .single();

        // Race the fetch against the timeout
        const { data, error: sbError } = await Promise.race([fetchPromise, timeoutPromise]);

        if (sbError || !data) {
          throw new Error("Setlist not found or link has expired.");
        }

        setSharedData(data.payload);
      } catch (err) {
        console.error("ShareView error:", err);
        setError(err.message || "Could not load setlist.");
      } finally {
        setLoading(false);
      }
    }

    fetchSharedSetlist();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Loading shared setlist...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#010719] text-white p-4 text-center">
        <h2 className="text-lg font-black text-red-400 mb-2">Oops!</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-4">{error || "Could not load setlist."}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg"
        >
          Go to App
        </button>
      </div>
    );
  }

  return (
    <SharedSetlistLiveMode 
      setlist={sharedData.setlist} 
      songs={sharedData.songs} 
    />
  );
}
