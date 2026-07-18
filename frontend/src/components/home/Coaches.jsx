import React, { useState, useEffect } from 'react';
import CoachCard from '../common/CoachCard';
import { API_URL } from '../../utils/api';

const CoachSection = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/coaches/public`)
      .then((res) => res.json())
      .then((data) => setCoaches(data.data || []))
      .finally(() => setLoading(false));
  }, []);

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

        {/* 2. The Clean Grid Mapping — reflows automatically as coaches are added/removed in the admin panel */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-muted text-xs font-black uppercase tracking-registry">Loading coaches...</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-obsidian/10 rounded-club">
            <p className="text-muted text-sm">Our coaching staff will be introduced here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {coaches.map((coach) => (
              <CoachCard
                key={coach.coach_id}
                coach={{
                  name: coach.full_name,
                  experience: `${coach.experience_years || 0} Years Pro`,
                  specialty: coach.specialization || 'Court Specialist',
                  phone: coach.phone,
                  onLeave: coach.status === 'on-leave',
                  image: coach.photo_url ? `${API_URL}${coach.photo_url}` : null,
                }}
              />
            ))}
          </div>
        )}

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
        </div>

      </div>
    </section>
  );
};

export default CoachSection;
