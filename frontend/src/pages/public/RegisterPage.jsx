import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  EyeOff, 
  Fingerprint, 
  FileUp, 
  CheckCircle2 
} from 'lucide-react';
import Background from "../../assets/images/tennis-play.jpg";

const RegisterPage = () => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-[#060807] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <img 
          src={Background} 
          alt="Club Atmosphere" 
          className="w-full h-full object-cover blur-32 scale-110" 
        />
      </div>
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-emerald-950/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-orange-950/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* --- REGISTRATION BOX --- */}
      <div className="w-full max-w-5xl bg-obsidian rounded-club overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col lg:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* LEFT PANEL: The "Waiting Room" Concept */}
        <div className="lg:w-2/5 bg-emerald p-10 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-amber/20 rounded-full blur-[100px] pointer-events-none" />
          
          <Link to="/" className="relative z-10 flex items-center gap-3 no-underline group w-fit">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-amber group-hover:text-obsidian transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-registry text-white/50 group-hover:text-white transition-colors">Cancel</span>
          </Link>

          <div className="relative z-10 space-y-6">
            <div className="w-10 h-1 bg-amber" />
            <h1 className="text-white text-5xl leading-[0.9] tracking-tighter">
              Secure <br /> <span className="text-amber italic">Onboarding.</span>
            </h1>
            <p className="text-white/60 text-xs leading-relaxed uppercase tracking-widest font-bold">
              Your credentials will be activated upon administrative verification.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex gap-4 items-center p-4 bg-obsidian/20 backdrop-blur-md rounded-2xl border border-white/5">
              <ShieldCheck className="text-amber" size={20} />
              <div>
                <p className="text-[10px] text-white font-black uppercase tracking-widest">Step 1: Application</p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Credentials & Profile */}
        <div className="flex-1 bg-[#080a0d] p-10 md:p-14 relative">
          <header className="mb-8">
            <h2 className="text-white text-2xl font-black uppercase tracking-tighter mb-1">Create Account</h2>
            <div className="h-0.5 w-8 bg-amber" />
          </header>

          <form className="space-y-5">
            {/* Section: Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 group">
                <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1 group-focus-within:text-amber transition-colors">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                  <input type="text" placeholder="Member Name" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all placeholder:text-white/5" />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1 group-focus-within:text-amber transition-colors">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                  <input type="tel" placeholder="+94 7..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all placeholder:text-white/5" />
                </div>
              </div>
            </div>

            {/* Section: Credentials */}
            <div className="pt-4 border-t border-white/5 space-y-5">
              <div className="space-y-2 group">
                <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1 group-focus-within:text-amber transition-colors">Portal Username</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                  <input type="text" placeholder="Choose a unique username" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all placeholder:text-white/5" />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1 group-focus-within:text-amber transition-colors">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-amber transition-colors" size={16} />
                  <input type="password" placeholder="••••••••••••" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white text-sm outline-none focus:border-amber/50 focus:ring-4 focus:ring-amber/10 transition-all" />
                  <EyeOff className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-white/40 cursor-pointer transition-colors" size={14} />
                </div>
              </div>
            </div>

            {/* Section: Payment Slip Upload */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-registry text-emerald/80 ml-1">Membership Payment Slip</label>
              <div className="relative group">
                <input 
                  type="file" 
                  id="payment-upload" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="payment-upload"
                  className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    fileName 
                      ? "bg-emerald/5 border-emerald/30" 
                      : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-amber/30"
                  }`}
                >
                  <div className="flex items-center gap-4 px-6">
                    {fileName ? (
                      <CheckCircle2 className="text-emerald" size={24} />
                    ) : (
                      <FileUp className="text-muted group-hover:text-amber transition-colors" size={24} />
                    )}
                    <div className="text-left">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${fileName ? "text-emerald" : "text-white"}`}>
                        {fileName ? "Slip Attached" : "Upload Slip"}
                      </p>
                      <p className="text-[8px] text-white/30 uppercase font-bold tracking-tighter">
                        {fileName ? fileName : "JPG, PNG or PDF (Max 5MB)"}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 space-y-4">
              <button 
                type="submit"
                className="w-full bg-emerald hover:bg-emerald/80 text-white font-black uppercase tracking-registry text-[10px] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald/20 group"
              >
                Submit for Approval
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-center text-[8px] text-muted font-black uppercase tracking-[0.2em]">
                By submitting, you agree to the Kandy Garden Club heritage protocols.
              </p>
            </div>
          </form>

          {/* Login Link */}
          <div className="pt-8 w-full text-center">
            <Link to="/login" className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-amber transition-colors">
              Existing Member? <span className="text-white/60">Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;