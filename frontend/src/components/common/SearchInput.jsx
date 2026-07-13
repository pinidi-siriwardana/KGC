import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Search...', dark = false, className = '' }) => (
    <div className="relative">
        <Search
            size={14}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-slate-500' : 'text-slate-400'}`}
        />
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium outline-none transition-all ${
                dark
                    ? 'bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-4 focus:ring-slate-700/40'
                    : 'bg-white border border-slate-200 focus:ring-4 focus:ring-slate-900/5'
            } ${className}`}
        />
    </div>
);

export default SearchInput;
