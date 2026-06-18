import React from 'react';
import { History, Target } from 'lucide-react';
import heritageImg from "../../assets/images/heritage-court.jpg";
import courtImg from "../../assets/images/court.jpg";

const AboutSection = () => {
  const highlights = [
    {
      icon: <History size={22} />,
      title: "145+ Years of Heritage",
      description: "Established in 1878, preserving colonial-era sportsmanship in Kandy."
    },
    {
      icon: <Target size={22} />,
      title: "Pro Excellence",
      description: "World-class clay courts maintained to international standards."
    }
  ];

  return (
    <section className="relative py-24 bg-alabaster overflow-hidden">
      {/* 1. Symmetrical Background Accents using your emerald variable */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald/5 -skew-x-12 translate-x-1/2 z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber/5 rounded-full blur-3xl z-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* 2. Visual Image Stack - Using --radius-club */}
          <div className="lg:w-1/2 relative w-full">
            {/* Main Image with the 3rem Radius */}
            <div className="relative z-10 rounded-club overflow-hidden shadow-2xl border-[12px] border-white transform hover:rotate-0 -rotate-2 transition-all duration-700">
              <img
                src={heritageImg}
                alt="Vintage Tennis"
                className="w-full h-[500px] lg:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-obsidian/10" />
            </div>

            {/* Overlapping Smaller Image - Using standard 2xl to contrast the club radius */}
            <div className="absolute -bottom-10 -right-6 z-20 hidden md:block w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border-8 border-white group">
              <img
                src={courtImg}
                alt="Modern Play"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
            </div>

            {/* Legacy Badge - Using your amber and obsidian variables */}
            <div className="absolute -top-8 -left-8 z-30 bg-amber text-obsidian p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center min-w-[140px] rotate-[-5deg]">
              <span className="block text-4xl font-black leading-none tracking-tighter">1878</span>
              <span className="block text-[8px] uppercase font-black tracking-registry mt-2 opacity-80">Established</span>
            </div>
          </div>

          {/* 3. Content Section */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 text-emerald text-[10px] font-black uppercase tracking-registry mb-6">
              <span className="w-1.5 h-1.5 bg-emerald rounded-full"></span>
              Kandy's Finest
            </div>

            <h2 className="text-obsidian text-5xl lg:text-7xl mb-8 leading-[1.1]">
              A Legacy of <br />
              <span className="text-emerald italic">Sporting Tradition</span>
            </h2>

            <p className="text-muted text-lg font-light leading-relaxed mb-12 max-w-xl">
              Nestled in the lush greenery of the hill capital, the Kandy Garden Club stands as a beacon of excellence. 
              Blending historic charm with professional-grade amenities, we remain the premier destination for racquet sports in Sri Lanka.
            </p>

            {/* Feature Mini-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
              {highlights.map((item, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-emerald/5 hover:border-emerald/20 hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 bg-obsidian text-amber rounded-xl flex items-center justify-center group-hover:bg-emerald group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-obsidian text-sm uppercase tracking-wide mb-1">{item.title}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Symmetrical Stat Bar - Utilizing the 3rem radius for an "Island" look */}
            <div className="p-8 rounded-club bg-obsidian flex items-center justify-between gap-4 shadow-2xl">
              <div className="text-center flex-1">
                <span className="block text-3xl font-black text-white leading-none">145+</span>
                <span className="text-[8px] uppercase tracking-registry text-white/40 font-bold mt-2 block">Years</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center flex-1">
                <span className="block text-3xl font-black text-amber leading-none">04</span>
                <span className="text-[8px] uppercase tracking-registry text-white/40 font-bold mt-2 block">Courts</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center flex-1">
                <span className="block text-3xl font-black text-emerald leading-none">500+</span>
                <span className="text-[8px] uppercase tracking-registry text-white/40 font-bold mt-2 block">Members</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;