import React from 'react';
import { Filter } from 'lucide-react';

const FilterSelect = ({ value, onChange, name, options, dark = false, className = '' }) => (
    <div className="relative">
        <Filter
            size={14}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-slate-500' : 'text-slate-400'}`}
        />
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide outline-none appearance-none cursor-pointer transition-all ${
                dark
                    ? 'bg-slate-800 border border-slate-700 text-slate-200 focus:ring-4 focus:ring-slate-700/40'
                    : 'bg-white border border-slate-200 focus:ring-4 focus:ring-slate-900/5'
            } ${className}`}
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

export default FilterSelect;
