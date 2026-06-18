import React from 'react';
import { Crown, Shirt, Clock, Wind, CheckCircle2, Info } from 'lucide-react';

const CourtRules = () => {
  const rules = [
    {
      id: "01",
      title: "Senior Member Sanctity",
      desc: "Court 01 is reserved exclusively for the use of Senior Members. This allows our most dedicated patrons a guaranteed space for traditional play.",
      icon: <Crown size={20} />,
      isHighlight: true
    },
    {
      id: "02",
      title: "Required Whites",
      desc: "All players must wear predominantly white tennis attire. Only clay-court specific, non-marking shoes are permitted on the red clay surfaces.",
      icon: <Shirt size={20} />,
      isHighlight: false
    },
    {
      id: "03",
      title: "The Sweeping Ritual",
      desc: "To preserve the championship bounce, players are required to drag the brushes and sweep the lines at the conclusion of their 60-minute block.",
      icon: <Wind size={20} />,
      isHighlight: false
    },
    {
      id: "04",
      title: "Punctuality & Grace",
      desc: "Please arrive 10 minutes prior. Slots are held for a maximum of 15 minutes before being released to the standby list.",
      icon: <Clock size={20} />,
      isHighlight: false
    }
  ];

  return (
    <section className="bg-alabaster py-24 px-6 lg:px-20 relative overflow-hidden">

      {/* 1. ARCHITECTURAL WATERMARK */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[15vw] font-serif text-obsidian/[0.02] rotate-90 origin-left pointer-events-none select-none tracking-tighter">
        ETIQUETTE
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* 2. CENTERED HEADER: Editorial V4 Style */}
        <div className="text-center mb-24 space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-amber" />
            <span className="text-[10px] font-black uppercase tracking-registry text-amber">The Standards</span>
            <div className="h-px w-12 bg-amber" />
          </div>
          <h2 className="text-obsidian text-6xl font-serif">
            Rules of <span className="italic font-normal text-emerald">Conduct.</span>
          </h2>
        </div>

        {/* 3. THE REGISTRY TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20 relative">

          {/* Central Vertical Spine (Desktop Only) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald/20 to-transparent -translate-x-1/2" />

          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className={`relative group flex flex-col ${index % 2 === 0 ? 'md:text-right md:items-end' : 'md:text-left md:items-start'}`}
            >
              {/* Icon Bubble with elevation */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-8 transition-all duration-700 shadow-2xl
                ${rule.isHighlight
                  ? 'bg-obsidian text-amber scale-110 shadow-obsidian/20'
                  : 'bg-white text-obsidian border border-obsidian/5 group-hover:border-emerald/30 group-hover:shadow-emerald/10'}
              `}>
                {rule.icon}
              </div>

              {/* Rule Content Card */}
              <div className="space-y-4 max-w-sm">
                <div className={`flex items-center gap-4 transition-all duration-500 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-amber font-serif italic text-2xl drop-shadow-sm">{rule.id}</span>
                  <h3 className="text-obsidian text-2xl font-serif">
                    {rule.title}
                  </h3>
                </div>

                <p className="text-muted text-sm leading-relaxed font-light font-sans">
                  {rule.desc}
                </p>

                {rule.isHighlight && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/5 text-emerald text-[9px] font-black uppercase tracking-registry mt-2 border border-emerald/10">
                    <CheckCircle2 size={12} /> Priority Enforcement
                  </div>
                )}
              </div>

              {/* Visual Connector Dot (Desktop) */}
              <div className={`hidden md:block absolute top-8 w-3 h-3 rounded-full border-2 border-alabaster transition-all duration-500
                ${rule.isHighlight ? 'bg-amber scale-125' : 'bg-emerald/20 group-hover:bg-emerald group-hover:scale-110'}
                ${index % 2 === 0 ? 'right-[-6.5px]' : 'left-[-6.5px]'}
              `} />
            </div>
          ))}
        </div>

        {/* 4. MANAGEMENT NOTICE: Dossier-Style */}
        <div className="mt-32 flex flex-col items-center">
          <div className="p-8 bg-white rounded-club border border-obsidian/5 shadow-sm flex flex-col md:flex-row items-center gap-8 max-w-3xl group">
            <div className="w-14 h-14 bg-amber/5 text-amber rounded-2xl flex items-center justify-center shrink-0 border border-amber/10 group-hover:bg-amber group-hover:text-white transition-all duration-500">
              <Info size={28} />
            </div>
            <p className="text-[12px] text-muted leading-relaxed italic text-center md:text-left font-serif">
              Management reserves the right to refuse entry to any player not complying with the club's traditional dress code or safety protocols. <span className="not-italic text-obsidian font-bold uppercase tracking-widest text-[10px] ml-2">— Registry Board</span>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CourtRules;