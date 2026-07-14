import React from 'react';
import { FileUp, CheckCircle2 } from 'lucide-react';

// Dashed-box file picker for a payment slip upload, shared by every form
// that accepts a receipt (renewal form, general payment modal).
const ReceiptUploadField = ({ file, onChange }) => (
    <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        file ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
    }`}>
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e.target.files[0])} />
        {file ? <CheckCircle2 className="text-emerald-600" size={18} /> : <FileUp className="text-slate-400" size={18} />}
        <span className="text-slate-600 text-xs font-bold">{file ? file.name : 'Upload JPG, PNG or PDF (Max 5MB)'}</span>
    </label>
);

export default ReceiptUploadField;
