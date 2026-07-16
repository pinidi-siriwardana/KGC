import React from 'react';
import { Award, CalendarCheck } from 'lucide-react';

const initials = (name) => (name || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

const CoachCard = ({ coach }) => {
  return (
    <div className="group relative">
      {/* Main Container with 3rem Radius */}
      <div className="relative h-[500px] rounded-club overflow-hidden shadow-2xl transition-all duration-700 group-hover:-translate-y-3 bg-obsidian">
        {coach.image ? (
          <img
            src={coach.image}
            alt={coach.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.85] saturate-[0.8]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-obsidian to-obsidian/60">
            <span className="text-white/20 text-8xl font-serif italic">{initials(coach.name)}</span>
          </div>
        )}

        {/* Brand Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent opacity-95" />

        {/* Coach Content Area */}
        <div className="absolute bottom-10 left-8 right-8 text-white">
          <div className="flex items-center gap-2 text-amber text-[9px] font-black uppercase tracking-registry mb-4">
            <Award size={14} />
            {coach.experience}
          </div>
          
          <h3 className="text-3xl font-serif italic mb-2 tracking-tight">
            {coach.name}
          </h3>
          
          <p className="text-white/50 text-[9px] font-black uppercase tracking-registry mb-8">
            {coach.specialty}
          </p>


        </div>
      </div>

      {/* Background Glow Accent (Design System Tool) */}
      <div className="absolute -inset-3 bg-emerald/5 rounded-club -z-10 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 blur-xl" />
    </div>
  );
};

export default CoachCard;