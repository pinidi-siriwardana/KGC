import React, { useState } from 'react';
import { Award, CalendarCheck, Phone } from 'lucide-react';

const initials = (name) => (name || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('');

const CoachCard = ({ coach }) => {
  // A photo can be deleted from disk after the page's data loads — onError
  // catches that 404 and falls back to the same initials placeholder used
  // when there's no photo at all, instead of a broken-image icon.
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <div className="group relative">
      {/* Main Container with 3rem Radius */}
      <div className="relative h-[500px] rounded-club overflow-hidden shadow-2xl transition-all duration-700 group-hover:-translate-y-3 bg-obsidian">
        {coach.onLeave && (
          <div className="absolute top-6 left-8 z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber text-obsidian text-[9px] font-black uppercase tracking-registry shadow-lg">
            <span className="w-1.5 h-1.5 bg-obsidian rounded-full" />
            On Leave
          </div>
        )}
        {coach.image && !imageBroken ? (
          <img
            src={coach.image}
            alt={coach.name}
            onError={() => setImageBroken(true)}
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

          {coach.phone && (
            <a href={`tel:${coach.phone}`} className="flex items-center gap-2 text-white/70 hover:text-amber text-xs font-bold transition-colors w-fit">
              <Phone size={13} />
              {coach.phone}
            </a>
          )}
        </div>
      </div>

      {/* Background Glow Accent (Design System Tool) */}
      <div className="absolute -inset-3 bg-emerald/5 rounded-club -z-10 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 blur-xl" />
    </div>
  );
};

export default CoachCard;