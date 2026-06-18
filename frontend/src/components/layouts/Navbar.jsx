import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ArrowUpRight, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'The Courts', path: '/courts' },
    { name: 'Updates', path: '/announcements' },
    { name: 'membership', path: '/membership' },
  ];

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none transition-all duration-700 ${isScrolled ? 'pt-4' : 'pt-8'}`}>
      
      <nav className={`
        pointer-events-auto flex items-center gap-6 px-3 py-2 rounded-full transition-all duration-500 
        relative group overflow-hidden
        ${isScrolled 
          ? 'bg-obsidian/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-95' 
          : 'bg-white/60 backdrop-blur-xl border border-obsidian/5 shadow-xl scale-100'}
      `}>
        
        {/* Adaptive Glow */}
        <div className={`absolute inset-0 rounded-full pointer-events-none ${isScrolled ? 'bg-gradient-to-b from-white/5 to-transparent' : 'bg-gradient-to-b from-black/5 to-transparent'}`} />

        {/* Brand Icon */}
        <Link to="/" className="relative w-10 h-10 bg-emerald rounded-full flex items-center justify-center shadow-lg shadow-emerald/20 overflow-hidden group/logo">
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/logo:translate-y-0 transition-transform duration-300" />
          <span className="relative text-white font-serif italic font-bold text-lg">K</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => `
                px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 no-underline relative
                ${isActive 
                  ? (isScrolled ? 'text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-obsidian bg-obsidian/5') 
                  : (isScrolled ? 'text-white/50 hover:text-white' : 'text-obsidian/40 hover:text-obsidian')}
              `}
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Elegant Separator */}
        <div className={`hidden md:block w-px h-5 bg-gradient-to-b from-transparent to-transparent ${isScrolled ? 'via-white/20' : 'via-obsidian/10'}`} />

        {/* Action Group: Portal + Register */}
        <div className="flex items-center gap-2">
          {/* Portal Link */}
          <Link 
            to="/login" 
            className={`hidden lg:flex items-center gap-2 px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase no-underline transition-all ${isScrolled ? 'text-amber hover:brightness-125' : 'text-obsidian hover:text-emerald'}`}
          >
            Portal
            <ArrowUpRight size={14} strokeWidth={3} className={isScrolled ? 'text-amber' : 'text-emerald'} />
          </Link>

          {/* Register Button - High Contrast */}
          <Link 
            to="/register" 
            className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase no-underline transition-all active:scale-95 shadow-lg
              ${isScrolled 
                ? 'bg-emerald text-white hover:bg-emerald/80 shadow-emerald/20' 
                : 'bg-obsidian text-white hover:bg-emerald shadow-obsidian/10'}
            `}
          >
            <UserPlus size={14} strokeWidth={3} />
            <span>Register</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className={`md:hidden p-2 rounded-full transition-colors ${isScrolled ? 'text-white hover:bg-white/10' : 'text-obsidian hover:bg-obsidian/5'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm z-[101] flex justify-center items-start p-6 pointer-events-auto">
            <div className="w-full max-w-sm bg-obsidian border border-white/10 rounded-[3rem] p-10 shadow-3xl animate-in slide-in-from-top-8 duration-500">
                <div className="flex justify-between items-center mb-16">
                    <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">Navigation</span>
                    <button onClick={() => setIsMenuOpen(false)} className="text-white w-10 h-10 flex items-center justify-center bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex flex-col gap-8">
                    {navLinks.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="font-serif italic text-4xl text-white/90 no-underline hover:text-emerald hover:pl-4 transition-all duration-300"
                    >
                        {link.name}
                    </NavLink>
                    ))}
                </div>
                <div className="h-px bg-white/5 my-10" />
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-white/5 text-white py-4 rounded-2xl no-underline text-center text-[10px] font-black tracking-widest uppercase border border-white/10">Portal</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="bg-emerald text-white py-4 rounded-2xl no-underline text-center text-[10px] font-black tracking-widest uppercase">Join</Link>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;