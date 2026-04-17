"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { GraduationCap, MapPin, ArrowRight, BrainCircuit, Sparkles, Loader2 } from "lucide-react";

export default function CompleteProfile() {
    const router = useRouter();
    const { isLoaded, user } = useUser();
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [step, setStep] = useState(1);
    
    const [grade, setGrade] = useState("");
    const [city, setCity] = useState("");
    const [userState, setUserState] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isLoaded && user) {
            const savedGrade = localStorage.getItem(`apnidisha_user_grade_${user.id}`);
            if (savedGrade) {
                router.replace("/dashboard");
            }
        }
    }, [isLoaded, user, router]);

    const grades = [
        "8th - 9th Grade",
        "10th Grade (Board Year)",
        "11th - 12th (Science/Math)",
        "11th - 12th (Commerce/Arts)",
        "College / Diploma",
    ];

    const handleSaveAndContinue = () => {
        if (!user) return;
        setIsSaving(true);
        
        localStorage.setItem(`apnidisha_user_grade_${user.id}`, grade);
        localStorage.setItem(`apnidisha_user_city_${user.id}`, city);
        localStorage.setItem(`apnidisha_user_state_${user.id}`, userState);

        setTimeout(() => {
            setIsSaving(false);
            router.push("/onboarding"); 
        }, 1200);
    };

    if (!mounted || !isLoaded) return <div className="min-h-screen bg-[#000000]"></div>;

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-[#000000] text-slate-200' : 'bg-[#f4f6f8] text-slate-900'}`}>
            
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full blur-[120px] ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-300/20'}`}></div>
            </div>

            <div className={`relative z-10 w-fupll max-w-2xl p-8 md:p-12 rounded-[2rem] border shadow-2xl backdrop-blur-xl ${isDark ? 'bg-[#111]/90 border-[#2A2A2A]' : 'bg-white/90 border-slate-200'}`}>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome to ApniDisha, {user?.firstName}!</h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Let's personalize your AI assessment.</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : (isDark ? 'bg-[#333]' : 'bg-slate-200')}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : (isDark ? 'bg-[#333]' : 'bg-slate-200')}`}></div>
                </div>

                {/* STEP 1: Education Level */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-2 mb-6">
                            <GraduationCap className="w-5 h-5 text-indigo-500" />
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>What is your current education level?</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                            {grades.map((g, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setGrade(g)}
                                    className={`p-4 text-left rounded-xl border font-bold text-sm transition-all outline-none ${grade === g ? (isDark ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-indigo-50 border-indigo-500 text-indigo-700') : (isDark ? 'bg-[#1A1A1A] border-[#333] text-slate-400 hover:border-[#555]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300')}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button 
                                disabled={!grade}
                                onClick={() => setStep(2)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors outline-none"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Location */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Where are you based?</h2>
                        </div>
                        <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This helps us recommend the best local Government Colleges and Institutes near you.</p>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>City</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Nagpur, Gwalior"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className={`w-full p-4 rounded-xl border outline-none transition-colors ${isDark ? 'bg-[#1A1A1A] border-[#333] text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>State</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., Maharashtra, Madhya Pradesh"
                                    value={userState}
                                    onChange={(e) => setUserState(e.target.value)}
                                    className={`w-full p-4 rounded-xl border outline-none transition-colors ${isDark ? 'bg-[#1A1A1A] border-[#333] text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(1)} className={`text-sm font-bold outline-none ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                Back
                            </button>
                            <button 
                                disabled={!city || !userState || isSaving}
                                onClick={handleSaveAndContinue}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors outline-none"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                {isSaving ? "Setting up AI..." : "Start AI Assessment"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}