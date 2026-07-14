import React from 'react';

// The bank-transfer detail grid shown wherever a member is asked to pay by
// bank transfer (renewal form, general payment modal). `note` renders above
// the Bank row for callers that want instruction text inside the same box.
const BankDetails = ({ settings, note }) => (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
        {note}
        <p className="text-[9px] font-black uppercase text-slate-400">Bank</p>
        <p className="text-slate-900 text-sm font-bold">{settings?.bank_name}</p>
        <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Account Name</p>
        <p className="text-slate-900 text-sm font-bold">{settings?.account_name}</p>
        <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Account Number</p>
        <p className="text-slate-900 text-sm font-bold font-mono">{settings?.account_number}</p>
        <p className="text-[9px] font-black uppercase text-slate-400 pt-2">Branch</p>
        <p className="text-slate-900 text-sm font-bold">{settings?.branch}</p>
    </div>
);

export default BankDetails;
