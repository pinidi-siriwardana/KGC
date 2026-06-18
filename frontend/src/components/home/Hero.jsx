import React from 'react';
import { ArrowRight, Trophy, Activity, MousePointer2 } from 'lucide-react';
import HeroImg from '../../assets/images/tennisPlayer.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-obsidian">
      
      {/* 1. FULL-SCREEN BACKGROUND WITH ENERGETIC OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img 
          src={HeroImg} 
          alt="Kandy Garden Club Courts" 
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* The "Organization" Layer: A dark emerald gradient that makes text pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/80 via-obsidian/40 to-obsidian/90 z-10" />
        <div className="absolute inset-0 bg-emerald/10 z-20 mix-blend-overlay" />
      </div>

      {/* 2. SYMMETRICAL CONTENT BLOCK */}
      <div className="relative z-30 px-6 w-full max-w-5xl mx-auto flex flex-col items-center text-center mt-20">
        
        

        {/* Main Heading: Symmetrical & Bold */}
        <h1 className="text-white text-6xl md:text-8xl lg:text-[120px] font-serif italic leading-none mb-8">
          Master the <br /> 
          <span className="not-italic text-emerald relative inline-block mt-2">
            Clay.
            {/* Symmetrical Underline */}
            <svg className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%]" viewBox="0 0 300 12" fill="none">
              <path d="M1 10C80 2 220 2 299 10" stroke="#fbbf24" strokeWidth="6" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>

        {/* Organized Subtext */}
        <p className="text-white/80 text-lg md:text-2xl font-light leading-relaxed max-w-2xl mx-auto mb-12">
          Step onto the historic courts of the Kandy Garden Club. Experience a century of tradition revitalized with high-performance energy.
        </p>

        {/* Centered Action Buttons */}
        <div className="flex flex-wrap justify-center gap-6 w-full">
          <button className="bg-emerald text-white px-10 py-5 rounded-club text-[11px] font-bold tracking-registry uppercase hover:bg-white hover:text-obsidian transition-all duration-300 shadow-2xl shadow-emerald/40 flex items-center group">
            Book a Court 
            <ArrowRight size={16} className="ml-3 group-hover:translate-x-2 transition-transform" />
          </button>
          
          <button className="bg-white/5 backdrop-blur-sm border border-white/10 text-white px-10 py-5 rounded-club text-[11px] font-bold tracking-registry uppercase hover:bg-white/10 transition-all flex items-center gap-3 group">
            <Trophy size={16} className="text-amber" />
            Club Rankings
          </button>
        </div>

        {/* Scroll Indicator - Adds to the organization and flow */}
        <div className="absolute bottom-[-100px] lg:bottom-[-150px] flex flex-col items-center gap-4 animate-bounce opacity-50">
           <span className="text-[8px] tracking-registry text-white uppercase font-bold vertical-text">Explore</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </div>

      {/* 3. CORNER DECOR (The "Elite" Polish) */}
      <div className="absolute top-10 left-10 hidden xl:block z-40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
            <span className="text-white font-serif italic">K</span>
          </div>
          <div className="h-[1px] w-12 bg-white/20" />
          <span className="text-[9px] tracking-registry text-white/40 uppercase font-bold">Heritage Sport</span>
        </div>
      </div>

    </section>
  );
};

export default Hero;