import React from 'react';
import CoachCard from '../common/CoachCard'; 
import { MoveRight } from 'lucide-react';
import rohanImg from "../../assets/images/rohan.jpg";
import saranImg from "../../assets/images/saran.jpg";
import devinImg from "../../assets/images/devin.jpg";

const CoachSection = () => {
  const coaches = [
    { id: 1, name: "Rohan Gunawardena", experience: "12 Years Pro", specialty: "Technical Analysis", rating: "4.9", image: rohanImg },
    { id: 2, name: "Saran Wijesinghe", experience: "8 Years Pro", specialty: "Junior Tactics", rating: "5.0", image: saranImg },
    { id: 3, name: "Devin Perera", experience: "15 Years Pro", specialty: "High Performance", rating: "4.8", image: devinImg }
  ];

  return (
    <section className="py-24 bg-alabaster">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        
        {/* 1. Integrated Header with Side Paragraph */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 text-emerald text-[9px] font-black uppercase tracking-registry mb-4">
              <span className="w-1 h-1 bg-emerald rounded-full animate-pulse" />
              The Pro Staff
            </div>
            <h2 className="text-obsidian text-5xl lg:text-7xl leading-[1.1]">
              Master Your Game with <br />
              <span className="text-emerald italic">Elite Coaching</span>
            </h2>
          </div>

          {/* The missing descriptive caption part */}
          <p className="text-muted text-lg max-w-sm border-l-2 border-amber pl-6 hidden lg:block font-light italic leading-relaxed">
            From foundation basics to tournament-level tactics, our ITF-certified professionals help you reach your peak performance in the heart of Kandy.
          </p>
        </div>

        {/* 2. The Clean Grid Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        {/* 3. Re-integrated Bottom CTA & Legacy Quote Section */}
        <div className="mt-24 p-12 lg:p-16 rounded-club bg-obsidian text-center relative overflow-hidden shadow-2xl border border-white/5">
          {/* Subtle design system light accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 blur-3xl rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald/5 blur-3xl rounded-full -ml-32 -mb-32" />
          
          <p className="text-amber/50 text-[10px] font-black uppercase tracking-registry mb-6">
            Tradition of Excellence
          </p>
          
          <h3 className="text-white text-3xl lg:text-4xl font-serif italic max-w-3xl mx-auto leading-[1.4]">
            "Tennis is more than a game; it's a century-old tradition of discipline and sporting elegance."
          </h3>

          {/* Symmetrical Action Link */}
          <div className="mt-10 flex justify-center">
             <button className="text-emerald hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-registry group">
               View Program Standards <MoveRight size={16} className="group-hover:translate-x-2 transition-transform" />
             </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CoachSection;