import React from 'react';
import { Trophy, Hammer, Bell, Megaphone, Minus } from 'lucide-react';

const AnnouncementSection = () => {
  const announcements = [
    {
      id: "01",
      category: "CHAMPIONSHIP",
      title: "Spring Open 2026 Registration",
      date: "MARCH 22, 2026",
      desc: "Tournament brackets for singles and doubles are now available at the clubhouse. Early bird registration ends this Friday. All members are encouraged to sign up.",
      icon: <Trophy size={24} />,
      accentColor: "bg-amber text-obsidian"
    },
    {
      id: "02",
      category: "MAINTENANCE",
      title: "Court 03 & 04 Surface Grooming",
      date: "MARCH 18, 2026",
      desc: "Surface leveling and line painting will occur from 08:00 AM to 12:00 PM. These courts will remain strictly closed during this window to ensure clay integrity.",
      icon: <Hammer size={24} />,
      accentColor: "bg-emerald text-alabaster"
    },
    {
      id: "03",
      category: "CLUB EVENT",
      title: "Easter Sunday Member Brunch",
      date: "MARCH 12, 2026",
      desc: "Join us on the Veranda for a traditional Hill Country brunch. Limited seating is available; please confirm your attendance with the clubhouse steward.",
      icon: <Bell size={24} />,
      accentColor: "bg-obsidian text-alabaster"
    }
  ];

  return (
    <section className="bg-alabaster py-24 px-6 lg:px-20 border-t border-obsidian/5">
      <div className="max-w-7xl mx-auto">

        {/* --- SECTION HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-emerald" />
              <span className="text-xs font-black uppercase tracking-registry text-emerald">Official Bulletin</span>
            </div>
            {/* font-serif (Playfair) inherited from base styles */}
            <h2 className="text-obsidian text-5xl md:text-6xl font-serif">
              Latest <span className="italic font-normal text-emerald">Notices.</span>
            </h2>
          </div>
          
          <div className="text-right pb-2 border-b border-obsidian/10">
            <p className="text-[10px] font-black uppercase tracking-registry text-muted opacity-60 mb-1">Registry Status</p>
            <p className="text-sm font-black text-obsidian uppercase tracking-widest">Active • March 2026</p>
          </div>
        </div>

        {/* --- ANNOUNCEMENT FEED --- */}
        <div className="grid grid-cols-1 gap-12">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-club p-10 md:p-14 border border-obsidian/5 flex flex-col md:flex-row gap-12 items-start transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(5,7,10,0.08)]"
            >
              {/* 1. Large ID Anchor & Icon */}
              <div className="flex flex-col items-center gap-6 shrink-0">
                <span className="text-7xl font-serif italic font-bold text-obsidian/5 group-hover:text-emerald/10 transition-colors">
                  {item.id}
                </span>
                <div className={`w-16 h-16 rounded-2xl ${item.accentColor} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500`}>
                  {item.icon}
                </div>
              </div>

              {/* 2. Main Body Content */}
              <div className="grow space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-registry text-muted">
                    {item.category}
                  </span>
                  <Minus className="text-obsidian/10" size={14} />
                  <span className="text-[10px] font-black uppercase tracking-registry bg-alabaster px-3 py-1 rounded">
                    {item.date}
                  </span>
                </div>

                <h3 className="text-obsidian text-3xl font-serif font-semibold leading-tight group-hover:text-emerald transition-colors">
                  {item.title}
                </h3>

                <p className="text-muted text-lg font-medium max-w-4xl border-l-2 border-emerald/20 pl-8 transition-all group-hover:border-emerald leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* 3. Decorative Accent */}
              <div className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Megaphone size={20} className="text-obsidian" />
              </div>
            </div>
          ))}
        </div>

        {/* --- BOTTOM STATUS STRIP --- */}
        <div className="mt-24 pt-10 border-t border-obsidian/5 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-registry text-obsidian/40">Kandy Garden Club • Registry Board</p>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse shadow-[0_0_8px_rgba(6,95,70,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-registry text-obsidian/40">Live Archive</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AnnouncementSection;