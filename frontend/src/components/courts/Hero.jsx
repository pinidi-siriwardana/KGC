import React from 'react';
import { Link } from 'react-router-dom'; // Added for internal navigation
import { ArrowRight, Trophy, Star, ShieldCheck } from 'lucide-react';
import courtImg from "../../assets/images/court-hero.jpg";

const ShadowCourtHero = () => {
  return (
    /* id="courts" added so users can jump here from other pages if needed */
    <section id="courts" className="relative min-h-screen bg-obsidian overflow-hidden flex flex-col pt-32">

      {/* 1. ATMOSPHERIC DEPTH: Cinematic Brand Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald/10 blur-[180px] rounded-full -translate-y-1/2 translate-x-1/4 z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4 z-0 pointer-events-none" />

      {/* 2. MAIN STAGE: Grid Layout */}
      <div className="flex-grow flex items-center px-6 lg:px-20 relative z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* LEFT: BOLD TYPOGRAPHY & STORY */}
          <div className="lg:col-span-6 space-y-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 backdrop-blur-md">
              <Star size={12} className="text-amber fill-amber animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Premier Club Experience</span>
            </div>

            <div className="space-y-6">
              {/* h1: Playfair Display + Sharp Tracking */}
              <h1 className="text-white text-7xl md:text-8xl lg:text-9xl font-serif leading-[0.85] tracking-tighter drop-shadow-2xl">
                Legacy <br />
                <span className="text-emerald not-italic underline decoration-amber/30 decoration-8 underline-offset-[12px]">Defined.</span>
              </h1>

              <p className="text-white/40 text-lg md:text-xl max-w-lg leading-relaxed font-sans font-light italic">
                Step into the hallowed grounds of Kandy’s most prestigious tennis destination. Four championship courts, meticulously groomed since 1878.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-4">
              {/* PRIMARY ACTION: Jump to the booking grid below */}
              <Link
                to="/courts#book"
                className="bg-white text-obsidian px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-registry hover:bg-emerald hover:text-white transition-all duration-500 shadow-2xl shadow-white/5 flex items-center gap-3 group no-underline"
              >
                Book A Court
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>

          {/* RIGHT: THE "ASSET" VISUAL (The Blade) */}
          <div className="lg:col-span-6 order-1 lg:order-2 relative">
            <div className="relative group">
              {/* Decorative Border Frame (Thin & Ghostly) */}
              <div className="absolute -inset-4 border border-white/5 rounded-club z-0 pointer-events-none group-hover:border-emerald/30 group-hover:scale-[1.02] transition-all duration-700" />

              {/* Main Image Container */}
              <div className="relative z-10 rounded-club overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] aspect-square lg:aspect-[4/5] bg-obsidian border border-white/10">
                <img
                  src={courtImg}
                  alt="Championship Tennis Court"
                  className="w-full h-full object-cover grayscale-[0.3] contrast-125 opacity-70 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[3s] ease-out"
                />

                {/* Cinematic Glass Badge Overlay */}
                <div className="absolute top-8 left-8 backdrop-blur-2xl bg-obsidian/40 border border-white/10 p-5 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald flex items-center justify-center text-white shadow-lg shadow-emerald/20">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-registry">Surface</p>
                      <p className="text-xs font-bold text-white font-sans uppercase tracking-widest">ITF Red Clay</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge: High Contrast Amber */}
                <div className="absolute bottom-8 right-8 bg-amber px-6 py-3 rounded-2xl shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                  <p className="text-obsidian font-black text-[9px] uppercase tracking-registry flex items-center gap-2">
                    <ShieldCheck size={14} /> Certified Elite
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. FOOTER INDICATORS: Minimalist Data Points */}
      <div className="px-6 lg:px-20 pb-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-20">
        <div className="flex gap-16 text-white/20">
          <div className="space-y-1">
            <p className="text-3xl font-serif italic font-bold text-white/40">04</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald/60">Active Courts</p>
          </div>
          <div className="h-10 w-px bg-white/5 self-center" />
          <div className="space-y-1">
            <p className="text-3xl font-serif italic font-bold text-white/40">24°</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber/60">Avg Temp</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="w-8 h-px bg-white/10" />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
              Professional Standards Since 1878
            </p>
        </div>
      </div>

    </section>
  );
};

export default ShadowCourtHero;