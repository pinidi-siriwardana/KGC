import React from 'react';
import { Zap, Bell, Globe, ArrowUpRight, MousePointer2 } from 'lucide-react';
import announcementImg from "../../assets/images/announcement-hero.jpg";

const Hero = () => {
  return (
    /* Changed bg-alabaster to a deep, warm Obsidian variant */
    <section className="relative min-h-screen bg-[#0c0806] flex flex-col pt-32 overflow-hidden font-sans">
      
      {/* --- ENHANCED ORANGISH BACKGROUND WASHES --- */}
      {/* Primary Orange Glow - Intense Top Left */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-orange-600/20 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Secondary Amber/Clay Glow - Bottom Right */}
      <div className="absolute bottom-[-10%] right-[5%] w-[60%] h-[60%] bg-amber-700/15 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Subtle "Fire" Vignette overlay to warm up the dark base */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 via-transparent to-amber-900/10 pointer-events-none" />

      {/* 1. STRUCTURAL BACKGROUND: Kept layout, updated colors to match the heat */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-black/40 hidden lg:block" />
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-orange-500/5 hidden lg:block" />

      {/* --- MAIN STAGE --- */}
      <div className="grow flex items-center px-6 lg:px-20 relative z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT COLUMN: Organized Content */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Organized Badge System */}
            <div className="flex items-center gap-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-600 text-white rounded-full shadow-lg shadow-orange-900/20">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-registry">Live Registry</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-200/50">Update Stream 2026</span>
              </div>
            </div>

            {/* Typography updated for Dark Mode Pop */}
            <div className="space-y-8">
              <h1 className="font-serif text-white text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter">
                Club <br />
                <span className="text-orange-500 italic drop-shadow-sm">Updates.</span>
              </h1>
              
              <div className="max-w-md border-l-4 border-orange-600/50 pl-8 py-2">
                <p className="text-white/60 text-lg font-medium leading-relaxed">
                  The definitive digital desk for championship schedules, court protocols, and official member correspondence.
                </p>
                <button className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-400 group">
                  Explore Archives 
                  <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </button>
              </div>
            </div>

            {/* Secondary Info Grid - Updated Borders */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Location</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Globe size={14} className="text-orange-500" />
                  <span>Kandy, Sri Lanka</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Current Status</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Bell size={14} className="text-amber-500" />
                  <span>Heritage Finals</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Visual Anchor */}
          <div className="lg:col-span-5 relative group">
            {/* Swapped white border for Obsidian/Glass border */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-club shadow-2xl border-[12px] border-white/5 backdrop-blur-md">
              <img
                src={announcementImg}
                alt="Tennis Grounds"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 brightness-75 contrast-125"
              />
              
              <div className="absolute bottom-6 right-6 left-6 bg-black/60 backdrop-blur-xl p-6 rounded-2xl text-white border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1">Active Series</p>
                    <p className="font-serif italic text-xl">Clay Series</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
                    <MousePointer2 size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Corner Accents shifted to Orange/Amber */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border-t-2 border-r-2 border-orange-500 opacity-30" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 border-b-2 border-l-2 border-amber-600 opacity-30" />
          </div>

        </div>
      </div>

      {/* --- FOOTER: Synced with Dark Theme --- */}
      <div className="w-full px-6 lg:px-20 py-12 flex justify-between items-center border-t border-white/5 relative z-20">
        <span className="text-[10px] font-black uppercase tracking-registry text-white/40">Status: Nominal</span>
        <div className="hidden md:flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-px bg-white/10" />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-registry text-white/40">Edition 2026</span>
      </div>

    </section>
  );
};

export default Hero;