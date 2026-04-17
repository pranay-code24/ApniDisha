"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit, Sun, Moon, ArrowRight, Target, Map, Sparkles } from "lucide-react";
import { SignInButton, SignUpButton, useAuth, useUser } from "@clerk/nextjs";

export default function Home() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        setMounted(true);
        
        if (isLoaded) {
            const hasTested = !!localStorage.getItem("apnidisha_final_cluster");
            if (isLoaded && isSignedIn && user) {
                const hasTested = !!localStorage.getItem(`apnidisha_final_cluster_${user.id}`);
                if (hasTested) {
                    setIsRedirecting(true);
                    router.replace("/dashboard");
                }
            }
        }
    }, [isLoaded, isSignedIn, user, router]);

    if (!mounted || !isLoaded || isRedirecting) {
        return <div className={`min-h-screen ${isDark ? 'bg-[#000000]' : 'bg-[#F8FAFC]'}`}></div>;
    }

    return (
        <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#000000] text-slate-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
            
            {/* Ambient Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-colors duration-700 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-400/20'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] transition-colors duration-700 ${isDark ? 'bg-cyan-900/20' : 'bg-cyan-400/20'}`}></div>
            </div>

            {/* Navbar */}
            <nav className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-colors duration-500 ${isDark ? 'border-[#222] bg-[#000000]/80' : 'border-slate-200/80 bg-white/80'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <span className={`text-xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Apni<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Disha</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isSignedIn && (
                            <div className="hidden md:flex items-center gap-3 mr-2">
                                <SignInButton 
                                    mode="modal" 
                                    forceRedirectUrl="/dashboard" 
                                    signUpForceRedirectUrl="/complete-profile"
                                >
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none">
                                        Sign In
                                    </button>
                                </SignInButton>
                            </div>
                        )}
                        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full outline-none transition-colors ${isDark ? 'hover:bg-[#222] text-slate-400 hover:text-yellow-400' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-20 text-center">
                
                <div className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-sm shadow-sm ${isDark ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-white border-slate-200 text-indigo-600'}`}>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    "Let's Build Future, Not Pressure"
                </div>

                <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight max-w-5xl mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Discover Your Intrest<br className="hidden md:block" />
                    With <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400">
                        ApniDisha
                    </span>
                </h1>

                <p className={`text-lg md:text-xl max-w-2xl mb-12 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Stop guessing your future. Take our highly accurate, adaptive psychometric test powered by Machine Learning to get a personalized career roadmap.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                    {isSignedIn ? (
                        <Link href="/onboarding" className="group relative w-full sm:w-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                            <button className={`relative w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                Start Test <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    ) : (
                        <div className="group relative w-full sm:w-auto">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                            <div className={`relative w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                <SignUpButton mode="modal" forceRedirectUrl="/complete-profile" signInForceRedirectUrl="/dashboard">
                                    <span className="flex items-center gap-2">Start Your AI Test <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                                </SignUpButton>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mt-24">
                    {[
                        {
                            icon: <BrainCircuit className="w-6 h-6" />,
                            title: "Adaptive ML Engine",
                            desc: "Our AI adapts to your answers in real-time, mapping your Big Five personality traits to Indian careers."
                        },
                        {
                            icon: <Map className="w-6 h-6" />,
                            title: "Personalized Roadmap",
                            desc: "Get a step-by-step actionable timeline from 10th grade stream selection to your first professional job."
                        },
                        {
                            icon: <Target className="w-6 h-6" />,
                            title: "Govt. College Integration",
                            desc: "Don't just get a career name. Find the exact Government colleges, ITIs, and Polytechnics near you."
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className={`p-8 rounded-[2rem] border text-left transition-all duration-300 hover:-translate-y-2 ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A] shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:border-indigo-500/50' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-300'}`}>
                            <div className={`p-3 rounded-xl inline-block mb-6 ${isDark ? 'bg-[#141414] text-indigo-400 border border-[#333]' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                {feature.icon}
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{feature.title}</h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className={`relative z-10 border-t py-8 text-center text-sm ${isDark ? 'border-[#2A2A2A] text-slate-500' : 'border-slate-200 text-slate-500'}`}>
                <p>© 2026 ApniDisha. Built with ❤️ by Pranay</p>
            </footer>
        </div>
    );
}