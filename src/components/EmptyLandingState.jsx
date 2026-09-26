import React from 'react';

export default function EmptyLandingState({ view }) {
  if (view === 'library') {
    return (
      <div className="flex-1 bg-[#010719] text-white flex flex-col justify-center items-start px-12 lg:px-20 py-12 selection:bg-cyan-500/30">
        
        {/* WELCOME SUBTITLE */}
        <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase mb-4">
          WELCOME TO SETLIST BUDDY
        </span>

        {/* HERO TITLE WITH CYAN KEY BADGE */}
        <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-4 max-w-3xl">
          <span className="inline-flex items-center justify-center px-2 py-1 mr-3 text-lg lg:text-2xl font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 rounded-lg align-middle">
            [G]
          </span>
          Every chart, ready when the key changes.
        </h1>

        {/* HERO SUBTEXT */}
        <p className="text-sm lg:text-base text-slate-400 max-w-xl mb-12 font-medium leading-relaxed">
          Build your songbook, transpose in a tap, and carry the right keys into every setlist.
        </p>

        {/* 3 STEPS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl border-t border-slate-800/80 pt-8">
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-500/80 block mb-1">01</span>
            <p className="text-xs font-bold text-white">Add or import your charts</p>
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-500/80 block mb-1">02</span>
            <p className="text-xs font-bold text-white">Arrange a setlist</p>
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-500/80 block mb-1">03</span>
            <p className="text-xs font-bold text-white">Open it on stage, ready to perform</p>
          </div>
        </div>

        {/* FOOTER CALLOUT */}
        <p className="text-[11px] font-bold text-cyan-400 mt-10">
          Start with the library controls on the left.
        </p>

      </div>
    );
  }

  // SETLISTS EMPTY VIEW
  return (
    <div className="flex-1 bg-[#010719] text-white flex flex-col justify-center items-center text-center px-8 py-12 selection:bg-cyan-500/30">
      
      {/* SET BADGE */}
      <span className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-xs font-bold mb-6 tracking-widest uppercase">
        SET
      </span>

      {/* HERO TITLE */}
      <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-4">
        Plan the room.
      </h1>

      {/* SUBTEXT */}
      <p className="text-xs lg:text-sm text-slate-400 max-w-md font-medium leading-relaxed">
        Create a setlist, then arrange songs with the keys and notes your band needs.
      </p>

    </div>
  );
}