import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const MembershipFAQ = () => {
  const [openIndex, setOpenIndex] = useState(0); 

  const faqs = [
    {
      q: "Regular vs. Senior?",
      a: "Regular covers all standard play and socials. Senior is a legacy tier for exclusive Court 01 access and board voting rights."
    },
    {
      q: "The Dress Code?",
      a: "Predominantly white attire is mandatory. Only non-marking, clay-specific outsoles are permitted on our red clay surfaces."
    },
    {
      q: "Guest Policy?",
      a: "Members may host guests via our allocation system. All visitors must be registered at the Registry Desk upon arrival."
    },
    {
      q: "Weather Protocols?",
      a: "Grounds are monitored 24/7. Court status is updated live here during monsoons to preserve the clay integrity."
    }
  ];

  return (
    <section className="bg-alabaster py-24 px-6 lg:px-20 border-t border-obsidian/5 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* Left: Static Briefing Section (Sticky) */}
        <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-px bg-emerald" />
               <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Inquiries</span>
            </div>
            <h2 className="text-obsidian text-7xl font-serif leading-[0.9]">
              Essential <br />
              <span className="italic font-normal text-emerald">Briefing.</span>
            </h2>
          </div>
          
          <p className="text-muted max-w-xs border-l-2 border-emerald/20 pl-6 text-sm leading-relaxed font-medium">
            Quick-reference guidelines regarding our heritage, court protocols, and membership stewardship.
          </p>

          <div className="pt-4 flex items-center gap-4 group cursor-pointer">
             <div className="w-14 h-14 rounded-full border border-obsidian/10 flex items-center justify-center text-obsidian group-hover:bg-obsidian group-hover:text-alabaster transition-all duration-500 shadow-sm">
                <HelpCircle size={20} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-obsidian">Ask Registry</span>
                <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Response within 24h</span>
             </div>
          </div>
        </div>

        {/* Right: The Registry Accordion */}
        <div className="lg:col-span-7 border-l border-obsidian/5 pl-0 lg:pl-16">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`group border-b border-obsidian/10 py-10 transition-all duration-700 ${openIndex === index ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-baseline justify-between text-left"
              >
                <div className="flex items-baseline gap-8">
                   <span className="text-sm font-serif italic text-emerald font-bold tracking-tighter w-6">
                     0{index + 1}
                   </span>
                   <h3 className={`text-2xl font-serif transition-all duration-500 ${openIndex === index ? 'text-emerald translate-x-3' : 'text-obsidian'}`}>
                     {faq.q}
                   </h3>
                </div>
                <div className={`transition-all duration-500 ${openIndex === index ? 'rotate-90 text-emerald' : 'text-obsidian/20 group-hover:text-obsidian'}`}>
                   {openIndex === index ? <Minus size={22} /> : <Plus size={22} />}
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-[500ms] ease-in-out ${openIndex === index ? 'max-h-64 mt-8' : 'max-h-0'}`}>
                 <div className="pl-14 relative">
                    {/* Amber accent bar for the "Registry Note" feel */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <p className="text-obsidian/70 text-lg leading-relaxed max-w-xl font-medium">
                      {faq.a}
                    </p>
                 </div>
              </div>
            </div>
          ))}
          
          {/* Column Footer Detail */}
          <div className="mt-16 flex justify-between items-center px-8 py-8 bg-white rounded-2xl border border-obsidian/5 shadow-sm">
             <span className="text-[9px] font-black uppercase tracking-registry text-muted opacity-50">Archive Audit: March 2026</span>
             <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-obsidian flex items-center justify-center">
                       <div className="w-1 h-1 rounded-full bg-emerald animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-registry text-obsidian">Official Board</span>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MembershipFAQ;