import React from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, PhoneCall } from 'lucide-react';

const ContactSection = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Inquiry Sent. The Club Secretary will contact you shortly.");
    };

    return (
        <section id='contact' className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-20">

                {/* Section Title */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 text-emerald text-[10px] font-black uppercase tracking-registry mb-4">
                        Concierge
                    </div>
                    <h2 className="text-obsidian text-5xl lg:text-7xl">
                        Get in <span className="text-emerald italic">Touch</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-club overflow-hidden shadow-2xl border border-obsidian/5">

                    {/* Left: Club Details (Obsidian Side) */}
                    <div className="lg:col-span-5 bg-obsidian p-10 md:p-16 text-white relative">
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber opacity-5 blur-3xl rounded-full" />
                        <h3 className="text-3xl font-serif italic text-amber mb-12">Club Information</h3>

                        <div className="space-y-10">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber border border-white/10 shrink-0">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-registry text-amber/50 font-black mb-1">Our Grounds</h4>
                                    <p className="text-white/90 text-lg font-medium leading-relaxed">Peradeniya Road,<br />Kandy, Sri Lanka</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber border border-white/10 shrink-0">
                                    <Phone size={22} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-registry text-amber/50 font-black mb-1">Phone</h4>
                                    <p className="text-white/90 text-lg font-medium">+94 (81) 222-3333</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-amber border border-white/10 shrink-0">
                                    <Mail size={22} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-registry text-amber/50 font-black mb-1">Email</h4>
                                    <p className="text-white/90 text-lg font-medium">hello@kandygardenclub.lk</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 pt-10 border-t border-white/10 flex items-center gap-5">
                            <Clock size={20} className="text-amber/40" />
                            <div>
                                <p className="text-[9px] uppercase tracking-registry font-black text-amber/40">Admin Hours</p>
                                <p className="text-sm font-bold text-white uppercase tracking-widest">Mon – Sun: 08:00 – 20:00</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: The Form (Restored with Phone Field) */}
                    <div className="lg:col-span-7 bg-white p-10 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-10">
                            <MessageSquare size={24} className="text-emerald" />
                            <h3 className="text-2xl font-black text-obsidian uppercase tracking-tighter">Send a Message</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Row 1: Full Name */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-registry text-obsidian/40 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-alabaster border border-obsidian/5 rounded-2xl py-5 px-6 text-obsidian focus:ring-2 focus:ring-emerald outline-none transition-all placeholder:text-obsidian/20 font-medium"
                                    placeholder="Enter your name"
                                />
                            </div>

                            {/* Row 2: Email and Contact Number (Split) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-registry text-obsidian/40 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-alabaster border border-obsidian/5 rounded-2xl py-5 px-6 text-obsidian focus:ring-2 focus:ring-emerald outline-none transition-all placeholder:text-obsidian/20 font-medium"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-registry text-obsidian/40 ml-1">Contact Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full bg-alabaster border border-obsidian/5 rounded-2xl py-5 px-6 text-obsidian focus:ring-2 focus:ring-emerald outline-none transition-all placeholder:text-obsidian/20 font-medium"
                                        placeholder="+94 7X XXX XXXX"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Your Message */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-registry text-obsidian/40 ml-1">Your Message</label>
                                <textarea
                                    rows="4"
                                    required
                                    className="w-full bg-alabaster border border-obsidian/5 rounded-2xl py-5 px-6 text-obsidian focus:ring-2 focus:ring-emerald outline-none transition-all resize-none placeholder:text-obsidian/20 font-medium"
                                    placeholder="How can we help the Club assist you?"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full md:w-fit bg-obsidian text-white px-12 py-5 rounded-full font-black uppercase tracking-registry text-[11px] flex items-center justify-center gap-4 hover:bg-emerald transition-all shadow-xl active:scale-95 group"
                            >
                                Send Message
                                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ContactSection;