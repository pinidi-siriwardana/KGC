import React from 'react';

const TONE_STYLES = {
  positive: { icon: 'bg-emerald-500/10 group-hover:bg-emerald-500', iconText: 'text-emerald-600 group-hover:text-white', trend: 'text-emerald-600' },
  warning: { icon: 'bg-amber-500/10 group-hover:bg-amber-500', iconText: 'text-amber-600 group-hover:text-white', trend: 'text-amber-600' },
  neutral: { icon: 'bg-slate-900/5 group-hover:bg-slate-900', iconText: 'text-slate-600 group-hover:text-white', trend: 'text-slate-500' },
};

const StatCard = ({ label, value, trend, icon: Icon, tone = 'positive' }) => {
  const styles = TONE_STYLES[tone] || TONE_STYLES.positive;

  return (
    <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-3xl hover:shadow-md hover:border-slate-200 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl transition-colors ${styles.icon}`}>
          <Icon className={styles.iconText} size={24} />
        </div>
        {trend !== undefined && trend !== null && trend !== '' && (
          <span className={`text-[10px] font-black uppercase tracking-widest ${styles.trend}`}>{trend}</span>
        )}
      </div>
      <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black mb-1">{label}</p>
      <h3 className="text-slate-900 text-3xl font-serif">{value}</h3>
    </div>
  );
};

export default StatCard;