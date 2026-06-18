import React from 'react';
import { Crown, Sun, Wind, Trophy, MapPin } from 'lucide-react';
import court1 from "../../assets/images/court1.jpg";
import court2 from "../../assets/images/court2.jpg";
import court3 from "../../assets/images/court3.jpg";

const CourtGallery = () => {
  const courtData = [
    {
      id: "01",
      name: "The Heritage Court",
      restriction: "Senior Members Only",
      feature: "Prime Clubhouse View",
      icon: <Crown size={18} className="text-amber" />,
      isPremium: true,
      img: court1,
    },
    {
      id: "02",
      name: "The Arena",
      restriction: "Open Access",
      feature: "Full Floodlight Array",
      icon: <Sun size={18} />,
      isPremium: false,
      img: court2,
    },
    {
      id: "03",
      name: "The Veranda Side",
      restriction: "Open Access",
      feature: "Morning Mist Shelter",
      icon: <Wind size={18} />,
      isPremium: false,
      img: court3,
    },
    {
      id: "04",
      name: "The Baseline",
      restriction: "Open Access",
      feature: "Championship Run-off",
      icon: <Trophy size={18} />,
      isPremium: false,
      img: court1,
    },
  ];

  return (
    <section className="bg-alabaster py-24 px-6 lg:px-20">
      <div className="max-w-7xl mx-auto">

        {/* Header Section: Aligned with Editorial V4 */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-emerald" />
              <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Championship Grounds</span>
            </div>
            <h2 className="text-obsidian text-5xl font-serif">
              Professional <span className="italic font-normal text-emerald">Red Clay.</span>
            </h2>
          </div>
          <div className="text-right pb-1 border-b border-obsidian/10">
            <p className="text-[10px] font-black uppercase tracking-registry text-obsidian/40 mb-1">Surface Specification</p>
            <p className="text-[11px] font-black text-obsidian uppercase tracking-widest">Slow-Pace Traditional Clay</p>
          </div>
        </div>

        {/* Gallery Grid: Enhanced Verticality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {courtData.map((court) => (
            <div
              key={court.id}
              className={`group relative h-[550px] lg:h-[650px] rounded-club overflow-hidden transition-all duration-1000 bg-obsidian
                ${court.isPremium ? 'ring-1 ring-amber/30 shadow-2xl' : 'border border-obsidian/5 shadow-xl shadow-obsidian/5'}
              `}
            >
              {/* Image: Ultra-slow zoom */}
              <img
                src={court.img}
                alt={court.name}
                className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[3s] ease-out opacity-80"
              />

              {/* Gradient Overlay: Deepest at the bottom for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-1000" />

              {/* Premium/Standard Badge */}
              <div className="absolute top-8 left-8 transform group-hover:-translate-y-1 transition-transform duration-700">
                {court.isPremium ? (
                  <div className="bg-amber text-obsidian px-5 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white/20">
                    <Crown size={12} fill="currentColor" />
                    <span className="text-[9px] font-black uppercase tracking-registry">Senior Elite</span>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-xl text-alabaster px-5 py-2 rounded-full border border-white/10">
                    <span className="text-[9px] font-black uppercase tracking-registry">Standard Play</span>
                  </div>
                )}
              </div>

              {/* Court Details: Slide-up Animation */}
              <div className="absolute inset-0 p-10 flex flex-col justify-end text-alabaster">
                <div className="space-y-6 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-out">

                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-serif italic text-amber/80 drop-shadow-md">{court.id}</span>
                    <div className="h-px flex-grow bg-alabaster/20" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-serif text-white mb-2 leading-tight tracking-tight">{court.name}</h3>
                    <div className="flex items-center gap-2 text-white/50">
                      <MapPin size={12} className="text-amber" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">{court.feature}</p>
                    </div>
                  </div>

                  {/* Restriction Tag */}
                  <div className="pt-4 border-t border-white/10 overflow-hidden">
                    <p className={`text-[9px] font-black uppercase tracking-registry flex items-center gap-2 transition-transform duration-1000 delay-100
                      ${court.isPremium ? 'text-amber' : 'text-emerald'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-current ${court.isPremium ? 'animate-pulse' : ''}`} />
                      {court.restriction}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informative Footer: Dossier Style */}
        <div className="mt-16 p-10 bg-white rounded-club border border-obsidian/5 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-obsidian/5">
          <div className="flex items-center gap-6 pb-6 md:pb-0 md:pr-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald/5 text-emerald flex items-center justify-center font-serif text-2xl italic font-bold border border-emerald/10">C</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-registry text-muted mb-1">Surface Type</p>
              <p className="text-[11px] font-black text-obsidian uppercase tracking-[0.2em]">International Red Clay</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 py-6 md:py-0 md:px-10">
            <div className="w-14 h-14 rounded-2xl bg-amber/5 text-amber flex items-center justify-center border border-amber/10">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-registry text-muted mb-1">Regulation</p>
              <p className="text-[11px] font-black text-obsidian uppercase tracking-[0.2em]">ITF Approved Grounds</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-6 md:pt-0 md:pl-10">
            <div className="w-14 h-14 rounded-2xl bg-obsidian/5 text-obsidian flex items-center justify-center border border-obsidian/10">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-registry text-muted mb-1">Exclusive</p>
              <p className="text-[11px] font-black text-obsidian uppercase tracking-[0.2em]">Senior Registry Area</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CourtGallery;