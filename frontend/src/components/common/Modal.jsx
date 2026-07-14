import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, onSubmit, submitText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
      {/* pt-24 keeps the card clear of any fixed top bar (dashboard header,
          public navbar) no matter how tall the card gets; overflow-y-auto on
          the outer layer lets the whole overlay scroll if a tall card still
          doesn't fit, instead of pushing the card's top edge up under the bar. */}
      <div className="min-h-full flex items-start justify-center px-4 pt-24 pb-10">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-4 bg-slate-50">
            <h3 className="text-slate-900 text-xs font-black uppercase tracking-widest">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <X size={18}/>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="max-h-[50vh] overflow-y-auto px-1 space-y-4 custom-scrollbar">
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
    </div>
  );
};

export default Modal;