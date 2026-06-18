import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, onSubmit, submitText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-slate-900 text-xs font-black uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="max-h-[60vh] overflow-y-auto px-1 space-y-4 custom-scrollbar">
            {children}
          </div>
          
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;