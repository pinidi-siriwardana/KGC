import React from 'react';
import { Crown, ShieldCheck, ArrowDown, Star } from 'lucide-react';
import memberHeroImg from "../../assets/images/membership-hero.jpg"; 

const MembershipHero = () => {
  return (
    /* Standardized Section Padding & Obsidian Black Foundation */
    <section className="relative min-h-screen bg-obsidian overflow-hidden flex flex-col pt-20">
      
      {/* 1. BACKGROUND DEPTH: Shady Overlays & Ethereal Glows */}
      {/* Grain Texture Overlay for that "Premium Paper/Film" feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10" />
      
      {/* High-Contrast Brand Glows — brighter than before so the section
          doesn't read as flat black */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-emerald/25 blur-[180px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber/15 blur-[150px] rounded-full z-0" />

      {/* --- MAIN STAGE --- */}
      <div className="grow flex items-center px-6 lg:px-20 py-20 relative z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 items-center">

          {/* LEFT: THE STEWARD CONTENT (6/12) */}
          <div className="lg:col-span-6 relative z-20 space-y-12">
            <div className="space-y-8">
              
              {/* Registry Badge */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur-md">
                   <Crown size={14} className="text-amber fill-amber shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Registry No. 1878</span>
                </div>
                <div className="h-px w-10 bg-emerald/30" />
              </div>

              <div className="space-y-6">
                {/* Serif Heading - Playfair Display */}
                <h1 className="font-serif text-white text-7xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tighter drop-shadow-2xl">
                  Become a <br />
                  <span className="italic font-normal text-emerald ">Steward.</span>
                </h1>
                <p className="text-white/65 max-w-md font-sans font-light leading-relaxed text-lg italic">
                  Join a century-long legacy of sportsmanship and community at the Hill Country’s premier tennis destination.
                </p>
              </div>

              {/* Minimalist Feature Row */}
              <div className="flex flex-col sm:flex-row gap-8 pt-6">
                 <div className="flex items-center gap-4 group cursor-help">
                    <div className="w-12 h-12 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald group-hover:bg-emerald group-hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(6,95,70,0)] group-hover:shadow-[0_0_20px_rgba(6,95,70,0.3)]">
                       <ShieldCheck size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Priority Access</span>
                 </div>
                 
                 <div className="flex items-center gap-4 group cursor-help">
                    <div className="w-12 h-12 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center text-amber group-hover:bg-amber group-hover:text-obsidian transition-all duration-500 shadow-[0_0_20px_rgba(251,191,36,0)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                       <Star size={20} fill="currentColor" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Elite Events</span>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT: THE APERTURE VISUAL (6/12) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] lg:aspect-square w-full max-w-xl ml-auto">
              
              {/* Decorative Floating Ring (Outermost line) */}
              <div className="absolute -inset-8 border border-white/5 rounded-club z-0 animate-pulse" />
              
              {/* Main Image Frame - rounded-club (3rem) */}
              <div className="relative h-full w-full rounded-club overflow-hidden shadow-[0_80px_100px_-30px_rgba(0,0,0,0.8)] border border-white/10 group bg-obsidian">
                <img
                  src={memberHeroImg}
                  alt="Club Heritage"
                  className="w-full h-full object-cover brightness-[0.9] contrast-110 saturate-100 group-hover:scale-105 group-hover:brightness-100 transition-all duration-[4s] ease-out"
                />

                {/* Cinematic Tint Overlays — lighter fade so the photo itself stays visible */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-emerald/10" />
                
                {/* Floating Stat Badge (The "Steward Card") */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] backdrop-blur-3xl bg-white/[0.06] border border-white/10 p-8 rounded-club flex justify-around items-center">
                   <div className="text-center">
                      <p className="text-4xl font-serif italic font-bold text-white leading-none mb-2">350+</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald">Active Members</p>
                   </div>
                   <div className="h-10 w-px bg-white/10" />
                   <div className="text-center">
                      <p className="text-4xl font-serif italic font-bold text-amber leading-none mb-2">148</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber">Legacy Years</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER: Registry Status Strip */}
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-20 py-12 flex justify-between items-center relative z-20 border-t border-white/5">
         <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
               {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-obsidian bg-obsidian overflow-hidden">
                     <div className="w-full h-full bg-emerald/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  </div>
               ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-registry text-white/40">Stewardship Registry Active</span>
         </div>
         
         <div className="flex items-center gap-3 animate-bounce cursor-pointer group">
            <span className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-amber transition-colors">Explore Tiers</span>
            <ArrowDown size={14} className="text-amber" />
         </div>
      </div>

    </section>
  );
};

export default MembershipHero;