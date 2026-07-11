import React from 'react';

const EXPIRING_SOON_DAYS = 14;

const MembershipStatusBadge = ({ endDate, isExpired }) => {
  if (isExpired === null || isExpired === undefined || !endDate) {
    return (
      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full border text-slate-500 bg-slate-50 border-slate-200">
        No Plan
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full border text-red-600 bg-red-50 border-red-100">
        Expired
      </span>
    );
  }

  const daysRemaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= EXPIRING_SOON_DAYS) {
    return (
      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full border text-amber-600 bg-amber-50 border-amber-100">
        Expiring Soon
      </span>
    );
  }

  return (
    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-100">
      Active
    </span>
  );
};

export default MembershipStatusBadge;
