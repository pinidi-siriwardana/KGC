import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Users, Trophy, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useClubSettings } from '../../hooks/useClubSettings';

// The backend only stores name/duration/price for a membership_type — the
// marketing copy below is presentational only. Keyed by plan name so real
// admin-managed plans (Junior/Senior today, whatever's added later) render
// correctly; PRESENTATION_FALLBACK covers any plan name we don't recognize.
const PRESENTATION = {
  'Junior Membership': {
    icon: Users,
    desc: 'Full access to our historic clay courts and clubhouse facilities for active players.',
    features: [
      'Access to Courts 02, 03, and 04',
      'Clubhouse & Veranda Privileges',
      'Member Socials & Club Ladders',
      'Standard Guest Entry Passes',
    ],
  },
  'Senior Membership': {
    icon: Crown,
    desc: 'The pinnacle of KGC membership. Reserved for long-standing patrons.',
    features: [
      'Exclusive Access to Court 01',
      'Priority Court Reservations',
      'Voting Rights & Private Lockers',
      'Legacy Event Invitations',
    ],
  },
};
const PRESENTATION_FALLBACK = {
  icon: Trophy,
  desc: 'A Kandy Garden Club membership tier with full access to club facilities.',
  features: ['Clubhouse & Court Access', 'Member Socials & Club Ladders', 'Guest Entry Passes'],
};

const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK')}`;

const MembershipPlans = () => {
  const { settings } = useClubSettings();
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/membership-types')
      .then((res) => res.json())
      .then((data) => setMembershipTypes(data.data || []))
      .catch(() => setMembershipTypes([]))
      .finally(() => setLoading(false));
  }, []);

  // Cheapest first for card order; the priciest tier gets the "premium" treatment.
  const sorted = [...membershipTypes].sort((a, b) => Number(a.price) - Number(b.price));
  const premiumId = sorted.length ? sorted[sorted.length - 1].membership_type_id : null;

  const tiers = sorted.map((t, index) => {
    const presentation = PRESENTATION[t.name] || PRESENTATION_FALLBACK;
    return {
      id: String(index + 1).padStart(2, '0'),
      name: t.name,
      price: formatLKR(t.price),
      duration: `${t.duration_months} month${t.duration_months === 1 ? '' : 's'}`,
      desc: presentation.desc,
      features: presentation.features,
      icon: <presentation.icon size={20} />,
      isPremium: t.membership_type_id === premiumId,
    };
  });

  return (
    <section className="bg-alabaster py-16 px-6 lg:px-20 border-t border-obsidian/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Tightened Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-emerald" />
              <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Enrollment Options</span>
            </div>
            <h2 className="text-obsidian text-4xl font-serif">
              Membership <span className="italic font-normal text-emerald">Tiers.</span>
            </h2>
          </div>
          <div className="text-right pb-1 border-b border-obsidian/10">
              <p className="text-[10px] font-black tracking-registry text-obsidian uppercase">Applications Open</p>
          </div>
        </div>

        {/* Smaller, Optimized Plan Cards */}
        {loading ? (
          <p className="text-muted text-[10px] uppercase tracking-widest font-black text-center py-16">Loading membership tiers...</p>
        ) : tiers.length === 0 ? (
          <p className="text-muted text-[10px] uppercase tracking-widest font-black text-center py-16">No membership tiers available right now — contact the admin for details.</p>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`group relative rounded-club p-8 md:p-10 border transition-all duration-700 
                ${tier.isPremium 
                  ? 'bg-obsidian text-alabaster border-emerald/20 shadow-xl' 
                  : 'bg-white border-obsidian/5 hover:shadow-xl'
                }
              `}
            >
              {/* Compact Header: ID and Icon integrated into one row */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                    ${tier.isPremium ? 'bg-emerald text-alabaster' : 'bg-obsidian text-alabaster'}`}>
                     {tier.icon}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black tracking-widest uppercase mb-0.5 ${tier.isPremium ? 'text-amber' : 'text-emerald'}`}>
                      {tier.price} / {tier.duration}
                    </p>
                    <h3 className={`text-xl font-serif ${tier.isPremium ? 'text-alabaster' : 'text-obsidian'}`}>
                      {tier.name}
                    </h3>
                  </div>
                </div>
                <span className="text-4xl font-serif italic font-bold opacity-5 pointer-events-none">
                  {tier.id}
                </span>
              </div>

              {/* Tightened Description */}
              <p className={`mb-8 text-sm leading-relaxed border-l-2 pl-6
                ${tier.isPremium ? 'text-alabaster/60 border-emerald' : 'text-muted border-obsidian/10 group-hover:border-emerald'}`}>
                {tier.desc}
              </p>

              {/* Compact Feature List */}
              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 gap-3">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <Check size={14} className="text-emerald shrink-0" />
                       <span className={`text-[11px] font-bold uppercase tracking-wide ${tier.isPremium ? 'text-alabaster/80' : 'text-obsidian/80'}`}>
                         {feature}
                       </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smaller Action Button */}
              <Link 
                to="/#contact" 
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 no-underline
                ${tier.isPremium 
                  ? 'bg-emerald text-alabaster hover:bg-amber hover:text-obsidian' 
                  : 'bg-obsidian text-alabaster hover:bg-emerald'
                }`}
              >
                Contact the Admin
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
        )}

        {/* Minimized Footer Detail */}
        <div className="mt-16 pt-8 border-t border-obsidian/5 flex justify-between items-center opacity-30 text-[9px] font-black uppercase tracking-registry text-obsidian">
           <p>Legacy Selection Process</p>
           <p>{settings.club_email}</p>
        </div>

      </div>
    </section>
  );
};

export default MembershipPlans;