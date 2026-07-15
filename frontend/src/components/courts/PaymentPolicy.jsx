import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Ban, UserX, ReceiptText } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import BankDetails from '../../components/common/BankDetails';

const formatLKR = (n) => (n ? `LKR ${Number(n).toLocaleString('en-LK')}` : null);

const PaymentPolicy = () => {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        apiFetch('/api/settings').then((res) => res.json()).then((data) => setSettings(data.data || null));
    }, []);

    const bookingFee = formatLKR(settings?.guest_booking_fee);
    const cancellationFee = formatLKR(settings?.cancellation_fee);
    const noShowFee = formatLKR(settings?.no_show_fee);

    const guidelines = [
        {
            icon: ReceiptText,
            title: 'Booking Fee',
            desc: bookingFee
                ? `Confirming a guest court reservation requires an upfront fee of ${bookingFee}, paid by bank transfer.`
                : 'Confirming a guest court reservation requires an upfront fee, paid by bank transfer.',
        },
        {
            icon: Clock,
            title: '5-Minute Hold',
            desc: 'Selecting an open slot holds it for 5 minutes while you transfer the fee and upload your payment slip. If time runs out before you submit, the slot is released back to the public.',
        },
        {
            icon: ShieldCheck,
            title: 'Admin Verification',
            desc: "Once submitted, the club admin reviews your payment slip and confirms the booking. You'll be able to see the confirmed status once it's approved.",
        },
        {
            icon: Ban,
            title: 'Cancellations',
            desc: cancellationFee
                ? `Cancelling a confirmed booking may incur a cancellation fee of ${cancellationFee}.`
                : 'Cancelling a confirmed booking may incur a cancellation fee — contact the club for details.',
        },
        {
            icon: UserX,
            title: 'No-Shows',
            desc: noShowFee
                ? `Failing to attend a confirmed booking without cancelling may incur a no-show fee of ${noShowFee}.`
                : 'Failing to attend a confirmed booking without cancelling may incur a no-show fee.',
        },
    ];

    return (
        <section className="bg-white py-24 px-6 lg:px-20 border-t border-obsidian/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-emerald" />
                        <span className="text-[10px] font-black uppercase tracking-registry text-emerald">Know Before You Book</span>
                        <div className="h-px w-12 bg-emerald" />
                    </div>
                    <h2 className="text-obsidian text-5xl font-serif">
                        Payment <span className="italic font-normal text-emerald">Policy &amp; Guidelines.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        {guidelines.map((item) => (
                            <div key={item.title} className="flex gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald/5 text-emerald flex items-center justify-center shrink-0 border border-emerald/10">
                                    <item.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-obsidian text-sm font-black uppercase tracking-widest">{item.title}</h3>
                                    <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:pl-8 lg:border-l lg:border-obsidian/5">
                        <p className="text-[10px] font-black uppercase text-obsidian/40 tracking-widest mb-4">Payments Are Accepted Via Bank Transfer To</p>
                        <BankDetails settings={settings} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PaymentPolicy;
