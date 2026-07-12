import React from 'react';

const StatCard = ({ label, value, trend, icon: Icon }) => (
  <div className="bg-white/[0.03] border border-white/5 p-8 rounded-club hover:border-emerald/30 transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-emerald/10 rounded-2xl group-hover:bg-emerald transition-colors">
        <Icon className="text-emerald group-hover:text-white" size={24} />
      </div>
      <span className="text-[10px] font-black text-emerald uppercase tracking-widest">{trend}</span>
    </div>
    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-1">{label}</p>
    <h3 className="text-slate-900 text-3xl font-serif">{value}</h3>
  </div>
);

export default StatCard;