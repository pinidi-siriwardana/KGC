import React from 'react';
import { ArrowUpRight, Trophy, Star, ChevronUp, MapPin, Mail, Globe } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { useClubSettings } from '../../hooks/useClubSettings';

const Footer = () => {
  const { settings } = useClubSettings();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Only shown once an admin sets a real URL from Club Settings — no more
  // dead '#' links.
  const socialLinks = [
    { Icon: FaFacebookF, href: settings.club_facebook_url },
    { Icon: FaInstagram, href: settings.club_instagram_url },
    { Icon: FaXTwitter, href: settings.club_twitter_url },
  ].filter((s) => s.href);

  return (
    <footer className="w-full bg-obsidian border-t border-white/5 relative overflow-hidden">
      {/* Artistic Ambient Background Elements */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald/20 via-transparent to-transparent hidden lg:block" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Column 1: The Artistic Vertical Branding */}
          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-emerald text-[9px] font-black uppercase tracking-[0.4em]">
                <Globe size={12} className="animate-spin-slow" />
                Central Province, SL
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-white leading-[0.9] tracking-tighter">
                Kandy Garden <br />
                <span className="text-emerald">Club</span>
              </h2>
            </div>

            <div className="flex gap-8 border-l border-white/10 pl-6">
               <div className="space-y-1">
                 <p className="text-amber text-[9px] font-black uppercase tracking-widest">Heritage</p>
                 <p className="text-white/40 text-[10px] font-light italic leading-tight">Est. 1878 <br/>148 Years</p>
               </div>
               <div className="space-y-1">
                 <p className="text-emerald text-[9px] font-black uppercase tracking-widest">Facility</p>
                 <p className="text-white/40 text-[10px] font-light italic leading-tight">ITF Standard <br/>Clay Courts</p>
               </div>
            </div>
          </div>

          {/* Column 2: Navigation & Contact (The Artistic "List") */}
          <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Directory</h4>
              <nav className="flex flex-col space-y-3">
                {['Grounds', 'Staff', 'Members', 'Events'].map((item) => (
                  <a 
                    key={item}
                    href={`#${item.toLowerCase()}`} 
                    className="text-white/50 hover:text-emerald transition-all flex items-center gap-4 group no-underline"
                  >
                    <span className="text-xs font-light tracking-widest uppercase">{item}</span>
                    <div className="h-px w-0 group-hover:w-8 bg-amber transition-all duration-500" />
                  </a>
                ))}
              </nav>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Studio</h4>
              <div className="space-y-4">
                <div className="group cursor-default">
                  <p className="text-[10px] text-white/30 uppercase font-black mb-1">Mail</p>
                  <p className="text-xs font-light text-white/60 group-hover:text-emerald transition-colors">{settings.club_email}</p>
                </div>
                <div className="group cursor-default">
                  <p className="text-[10px] text-white/30 uppercase font-black mb-1">Location</p>
                  <p className="text-xs font-light text-white/60 group-hover:text-emerald transition-colors">{settings.club_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: The Call to Action */}
          <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-between gap-12 self-stretch">
            <div className="flex gap-4">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white hover:border-emerald transition-all duration-500"
                >
                  <social.Icon size={18} />
                </a>
              ))}
            </div>

            <button 
              onClick={scrollToTop}
              className="group flex flex-col items-start lg:items-end gap-2 text-[9px] font-black uppercase tracking-[0.5em] text-white/20 hover:text-amber transition-all"
            >
              <span>Scroll to Top</span>
              <div className="w-16 h-px bg-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
              </div>
            </button>
          </div>
        </div>

        {/* Minimalist Legal - High contrast, fine type */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[8px] uppercase tracking-[0.6em] text-white/10 font-black">
            Kandy Garden Club © {currentYear} • A Century of Excellence
          </div>

          <div className="flex gap-12 text-[8px] uppercase tracking-[0.4em] font-black">
            <a href="#" className="text-white/15 hover:text-emerald no-underline transition-colors">Privacy</a>
            <a href="#" className="text-white/15 hover:text-emerald no-underline transition-colors">Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;