import React, { useState } from 'react';
import { Activity, Scale, Flame, TrendingDown, Minus, TrendingUp } from 'lucide-react';

const ACTIVITY_LEVELS = [
    { value: '1.2', label: 'Sedentary', hint: 'Little or no exercise' },
    { value: '1.375', label: 'Lightly Active', hint: 'Light exercise 1–3 days/week' },
    { value: '1.55', label: 'Moderately Active', hint: 'Moderate exercise 3–5 days/week' },
    { value: '1.725', label: 'Very Active', hint: 'Hard exercise 6–7 days/week' },
    { value: '1.9', label: 'Extremely Active', hint: 'Very hard exercise & physical job' },
];

const BMI_CATEGORY = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', tone: 'text-amber-600 bg-amber-50 border-amber-100' };
    if (bmi < 25) return { label: 'Normal Weight', tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (bmi < 30) return { label: 'Overweight', tone: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'Obese', tone: 'text-rose-600 bg-rose-50 border-rose-100' };
};

const emptyForm = () => ({ weight: '', height: '', age: '', gender: 'male', activity: '1.55' });

// Formula-only — BMI and BMR/TDEE are standard, deterministic calculations
// (Mifflin-St Jeor equation), not "live data" a third-party API would add
// value fetching. No storage: purely local state, recomputed on submit.
const FitnessCalculator = () => {
    const [form, setForm] = useState(emptyForm);
    const [result, setResult] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        const weight = Number(form.weight);
        const height = Number(form.height);
        const age = Number(form.age);
        const activityMultiplier = Number(form.activity);

        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        const bmr = form.gender === 'male'
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

        const tdee = bmr * activityMultiplier;

        setResult({
            bmi: Math.round(bmi * 10) / 10,
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
        });
    };

    const category = result ? BMI_CATEGORY(result.bmi) : null;

    return (
        <div className="relative space-y-8 animate-in fade-in duration-700">
            <header className="relative z-10 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Activity size={32} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="text-slate-900 text-4xl font-serif italic">BMI &amp; Calorie Calculator</h1>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        A quick, one-time check — nothing is saved
                    </p>
                </div>
            </header>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                    <h3 className="text-slate-800 text-lg font-serif italic mb-6 flex items-center gap-2">
                        <Scale size={18} className="text-slate-400" /> Your Details
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Weight (kg)</label>
                                <input
                                    type="number" min="20" max="300" step="0.1" required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-600/10"
                                    value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Height (cm)</label>
                                <input
                                    type="number" min="100" max="250" step="0.1" required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-600/10"
                                    value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Age</label>
                                <input
                                    type="number" min="10" max="100" required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-600/10"
                                    value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Gender</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-600/10"
                                    value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Activity Level</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-emerald-600/10"
                                value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}
                            >
                                {ACTIVITY_LEVELS.map((a) => (
                                    <option key={a.value} value={a.value}>{a.label} — {a.hint}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 px-6 py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <Flame size={14} /> Calculate
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
                    <h3 className="text-slate-800 text-lg font-serif italic mb-6">Your Results</h3>

                    {!result ? (
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black py-16 text-center">
                            Fill in your details and calculate to see your BMI and daily calorie needs.
                        </p>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Body Mass Index</p>
                                    <p className="text-slate-900 text-3xl font-serif">{result.bmi}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${category.tone}`}>
                                    {category.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">BMR (Resting)</p>
                                    <p className="text-slate-900 text-xl font-serif">{result.bmr.toLocaleString()}</p>
                                    <p className="text-slate-400 text-[9px] uppercase font-bold mt-1">calories / day</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">TDEE (Active)</p>
                                    <p className="text-slate-900 text-xl font-serif">{result.tdee.toLocaleString()}</p>
                                    <p className="text-slate-400 text-[9px] uppercase font-bold mt-1">calories / day</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Daily Calorie Targets</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl">
                                        <span className="flex items-center gap-2 text-rose-700 text-xs font-bold"><TrendingDown size={14} /> Weight Loss</span>
                                        <span className="text-rose-700 text-sm font-bold font-mono">{Math.max(0, result.tdee - 500).toLocaleString()} kcal</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <span className="flex items-center gap-2 text-slate-700 text-xs font-bold"><Minus size={14} /> Maintenance</span>
                                        <span className="text-slate-700 text-sm font-bold font-mono">{result.tdee.toLocaleString()} kcal</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <span className="flex items-center gap-2 text-emerald-700 text-xs font-bold"><TrendingUp size={14} /> Weight Gain</span>
                                        <span className="text-emerald-700 text-sm font-bold font-mono">{(result.tdee + 500).toLocaleString()} kcal</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-[10px] leading-relaxed italic">
                                Estimates only, based on the Mifflin-St Jeor equation — not medical advice. Consult a professional for personalized guidance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FitnessCalculator;
