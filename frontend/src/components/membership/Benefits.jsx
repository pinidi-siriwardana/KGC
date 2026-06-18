import React from 'react';
import { Coffee, CloudSun, Target, Award, ShieldCheck, GlassWater, ArrowRight } from 'lucide-react';

const MembershipBenefits = () => {
  const benefits = [
    {
      title: "Pristine Red Clay",
      desc: "Daily professional grooming ensures the most consistent bounce and slide in the Hill Country.",
      icon: <Target size={24} />,
    },
    {
      title: "The Veranda Lounge",
      desc: "Exclusive access to our historic member lounge for post-match refreshments and social gatherings.",
      icon: <Coffee size={24} />,
    },
    {
      title: "Championship Play",
      desc: "Guaranteed entry into all club-sanctioned tournaments and seasonal championship ladders.",
      icon: <Award size={24} />,
    },
    {
      title: "Guest Privileges",
      desc: "Share the KGC experience with friends and family through our flexible guest allocation system.",
      icon: <ShieldCheck size={24} />,
    },
    {
      title: "Heritage Socials",
      desc: "Priority invitations to our traditional calendar of events, from Easter Brunch to Year-end Galas.",
      icon: <GlassWater size={24} />,
    },
    {
      title: "Climate Ready",
      desc: "Real-time court playability updates and drainage systems designed for the Kandy climate.",
      icon: <CloudSun size={24} />,
    }
  ];

  return (
    <section className="bg-obsidian py-24 px-6 lg:px-20 border-t border-white/5 relative overflow-hidden">
      
      {/* Subtle Ambient Shade for Background Depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header - Aligned with Editorial Design */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-emerald" />
              <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Member Life</span>
            </div>
            <h2 className="text-alabaster text-5xl md:text-6xl font-serif">
              Exclusive <span className="italic font-normal text-emerald">Benefits.</span>
            </h2>
          </div>
          <div className="hidden md:block pb-2 border-b border-white/10">
             <p className="text-[10px] font-black uppercase tracking-registry text-white/30">Registry Service • 2026</p>
          </div>
        </div>

        {/* Benefits Grid: 3-Column Elite Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-20">
          {benefits.map((benefit, index) => (
            <div key={index} className="group space-y-8">
              <div className="flex items-center gap-6">
                {/* Icon Container with Micro-Border */}
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-emerald group-hover:bg-emerald group-hover:text-obsidian group-hover:shadow-[0_0_30px_rgba(6,95,70,0.3)] transition-all duration-700">
                  {benefit.icon}
                </div>
                {/* Visual Line Bridge */}
                <div className="h-px grow bg-white/5 group-hover:bg-emerald/20 transition-colors duration-700" />
              </div>

              <div className="space-y-4">
                <h3 className="text-alabaster text-2xl font-serif font-medium group-hover:text-emerald transition-colors duration-500">
                  {benefit.title}
                </h3>
                <p className="text-white/40 font-sans font-light leading-relaxed text-base group-hover:text-white/60 transition-colors duration-500">
                  {benefit.desc}
                </p>
              </div>
            </div>
          ))}
        </div>



      </div>
    </section>
  );
};

export default MembershipBenefits;