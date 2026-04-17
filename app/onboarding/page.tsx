"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
// 🔥 FIX: Added 'Target' icon for the new feature lists
import { ArrowLeft, ArrowRight, BrainCircuit, Sun, Moon, Sparkles, Activity, Timer, XCircle, Lock, Zap, Lightbulb, Bot, GraduationCap, Target } from "lucide-react";

export default function Onboarding() {
    const router = useRouter();
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user } = useUser();

    const [step, setStep] = useState(1);
    const [scores, setScores] = useState({
        Realistic: 0, Investigative: 0, Artistic: 0,
        Social: 0, Enterprising: 0, Conventional: 0
    });
    
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [currentCategory, setCurrentCategory] = useState("");
    const [currentCluster, setCurrentCluster] = useState(""); 
    const [isAiMode, setIsAiMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clusterPrefs, setClusterPrefs] = useState<Record<string, number>>({});
    const [currentImage, setCurrentImage] = useState(""); 
    const [imageError, setImageError] = useState(false); 

    const [history, setHistory] = useState<any[]>([]);
    const [future, setFuture] = useState<any[]>([]);
    
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const totalQuestions = 20;

    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchNextQuestion(1, scores, 0, "", {}, []);
    }, []);

    const animateTransition = (callback: () => void) => {
        setIsAnimating(true);
        setTimeout(() => {
            callback();
            setTimeout(() => setIsAnimating(false), 50); 
        }, 300); 
    };

    const fetchNextQuestion = async (
        nextStep: number, 
        currentScores: any, 
        lastRating: number, 
        cluster: string,
        prefs: Record<string, number>,
        prevQs: string[]
    ) => {
        setLoading(true);
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: nextStep,
                    scores: currentScores,
                    last_rating: lastRating,
                    current_cluster: cluster,
                    cluster_prefs: prefs,
                    previous_questions: prevQs
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.is_complete) {
                    const userId = user?.id || "guest";
                    let testHistory = JSON.parse(localStorage.getItem(`apnidisha_test_history_${userId}`) || "[]");

                    const newTest = {
                        cluster: data.final_cluster,
                        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        confidence: data.conf_score || "94.2",
                        attempt: testHistory.length + 1 
                    };
                    
                    testHistory.unshift(newTest); 
                    
                    localStorage.setItem(`apnidisha_test_history_${userId}`, JSON.stringify(testHistory));
                    localStorage.setItem(`apnidisha_final_cluster_${userId}`, data.final_cluster);
                    localStorage.setItem(`apnidisha_recommended_jobs_${userId}`, JSON.stringify(data.recommended_jobs));
                    localStorage.setItem(`apnidisha_confidence_score_${userId}`, newTest.confidence.toString());
                    
                    router.push("/dashboard");
                    return;
                } else {
                    setCurrentQuestion(data.question);
                    setIsAiMode(data.type === "adaptive");
                    setCurrentImage(data.image_url || "");
                    setImageError(false); 
                    
                    if (data.type === "base") setCurrentCategory(data.category);
                    if (data.type === "adaptive") setCurrentCluster(data.predicted_cluster);
                    setStep(data.step);
                }
            } else {
                alert("Error from backend : " + data.error);
            }
        } catch(error) {
            console.error("Fetch error : ", error);
            alert("Failed to connect to the server.");
        }
        setLoading(false);
    };

    const handleAnswer = (rating: number) => {
        setAnswers(prev => ({ ...prev, [step]: rating }));

        const newPrevQs = history.map(h => h.currentQuestion);
        if (currentQuestion) newPrevQs.push(currentQuestion);

        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, currentImage };
        
        animateTransition(() => {
            setHistory([...history, currentState]);
            setFuture([]); 

            let newScores = { ...scores };
            let newPrefs = { ...clusterPrefs };
            
            if (!isAiMode && currentCategory) {
                newScores[currentCategory as keyof typeof newScores] += (rating * 2);
            } else if (isAiMode && currentCluster) {
                if (!newPrefs[currentCluster]) newPrefs[currentCluster] = 0;
                
                if (rating === 1) newPrefs[currentCluster] -= 20; 
                else if (rating === 2) newPrefs[currentCluster] -= 10; 
                else if (rating === 4) newPrefs[currentCluster] += 15; 
                else if (rating === 5) newPrefs[currentCluster] += 30; 
                
                setClusterPrefs(newPrefs);
            }

            setScores(newScores);
            fetchNextQuestion(step + 1, newScores, rating, currentCluster, newPrefs, newPrevQs); 
        });
    };

    const handleBack = () => {
        if (history.length === 0) return;
        animateTransition(() => {
            const previousState = history[history.length - 1];
            const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, currentImage };
            
            setFuture([currentState, ...future]);
            setHistory(history.slice(0, -1));
            
            setStep(previousState.step);
            setScores(previousState.scores);
            setCurrentQuestion(previousState.currentQuestion);
            setCurrentCategory(previousState.currentCategory);
            setCurrentCluster(previousState.currentCluster);
            setIsAiMode(previousState.isAiMode);
            setClusterPrefs(previousState.clusterPrefs);
            
            setCurrentImage(previousState.currentImage);
            setImageError(false);
        });
    };

    const handleForward = () => {
        if (future.length === 0) return;
        animateTransition(() => {
            const nextState = future[0];
            const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, currentImage };
            
            setHistory([...history, currentState]);
            setFuture(future.slice(1));
            
            setStep(nextState.step);
            setScores(nextState.scores);
            setCurrentQuestion(nextState.currentQuestion);
            setCurrentCategory(nextState.currentCategory);
            setCurrentCluster(nextState.currentCluster);
            setIsAiMode(nextState.isAiMode);
            setClusterPrefs(nextState.clusterPrefs);
            
            setCurrentImage(nextState.currentImage);
            setImageError(false);
        });
    };

    const jumpToStep = (targetStep: number) => {
        if (targetStep === step) return;
        
        animateTransition(() => {
            const currentStateObj = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, currentImage };
            
            const timeline = [...history, currentStateObj, ...future];
            timeline.sort((a, b) => a.step - b.step);

            const targetIndex = timeline.findIndex(s => s.step === targetStep);

            if (targetIndex !== -1) {
                const targetState = timeline[targetIndex];
                
                setHistory(timeline.slice(0, targetIndex));
                setFuture(timeline.slice(targetIndex + 1));
                
                setStep(targetState.step);
                setScores(targetState.scores);
                setCurrentQuestion(targetState.currentQuestion);
                setCurrentCategory(targetState.currentCategory);
                setCurrentCluster(targetState.currentCluster);
                setIsAiMode(targetState.isAiMode);
                setClusterPrefs(targetState.clusterPrefs);
                setCurrentImage(targetState.currentImage);
                
                setImageError(false);
            }
        });
    };

    const renderInputArea = () => {
        const savedAnswer = answers[step]; 
        
        const mcqOptions = [
            { val: 5, emoji: "🚀", text: "Absolutely! This sounds exactly like me." },
            { val: 4, emoji: "👍", text: "Yeah, I'd give that a shot." },
            { val: 2, emoji: "🤔", text: "Not really my cup of tea." },
            { val: 1, emoji: "🛑", text: "No way, I would hate doing that." }
        ];

        return (
            <div className="grid grid-cols-1 gap-4 mt-6 w-full">
                {mcqOptions.map((btn) => {
                    const isSelected = savedAnswer === btn.val;
                    return (
                        <button 
                            key={btn.val} 
                            onClick={() => handleAnswer(btn.val)} 
                            className={`w-full flex items-center gap-4 text-left px-5 py-4 rounded-2xl transition-all duration-200 font-semibold border-2 outline-none active:scale-95 group
                                ${isSelected 
                                    ? isDark ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                                    : isDark ? 'bg-[#141414] border-[#2A2A2A] text-slate-300 hover:border-indigo-500/30' : 'bg-white border-slate-100 shadow-sm text-slate-700 hover:border-indigo-200'
                                }
                            `}
                        >
                            <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl text-2xl transition-colors ${isSelected ? (isDark ? 'bg-indigo-500/20' : 'bg-white shadow-sm') : (isDark ? 'bg-[#222] group-hover:bg-[#111]' : 'bg-slate-50 group-hover:bg-white')}`}>
                                {btn.emoji}
                            </div>
                            <span className="flex-1 leading-snug">
                                {btn.text}
                            </span>
                        </button>
                    )
                })}
            </div>
        );
    };

    if (!mounted) return null;

    const maxAllowedStep = Math.max(step, ...history.map(s => s.step), ...future.map(s => s.step));
    const answeredCount = Object.keys(answers).length;
    const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return { m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') };
    };

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isDark ? 'bg-[#000000] text-slate-200' : 'bg-[#f1f3f9] text-slate-900'}`}>
            
            <header className={`h-16 flex items-center justify-between px-6 border-b sticky top-0 z-50 shadow-sm transition-colors duration-500 shrink-0 ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-200'}`}>
                <Link href="/" className="flex items-center gap-2 outline-none">
                    <img src="/image.jpeg" alt="Apni Disha Logo" className="w-8 h-8 rounded-lg object-contain" />
                    <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Apni<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Disha</span>
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full outline-none transition-colors ${isDark ? 'hover:bg-[#222] text-slate-400 hover:text-yellow-400' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => window.location.href = "mailto:support@apnidisha.com?subject=Need%20Help%20with%20ApniDisha%20Assessment"}
                        className={`text-sm font-semibold hidden md:block outline-none transition-colors ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
                    >
                        Need Help?
                    </button>
                    <div className="flex items-center justify-center transition-transform hover:scale-105">
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }} />
                    </div>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row flex-1 p-4 md:p-6 gap-5 max-w-[1400px] mx-auto w-full items-stretch xl:h-[calc(100vh-88px)]">
                
                {/* 🎯 LEFT SIDEBAR */}
                <aside className="w-full xl:w-64 flex flex-col gap-4 h-full">
                    
                    <div className={`w-full rounded-[1.5rem] border p-6 shadow-sm transition-colors duration-500 shrink-0 ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Questions</h3>
                        
                        <div className="grid grid-cols-5 xl:grid-cols-4 gap-2 md:gap-3">
                            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
                                const isCurrent = qNum === step;
                                const isLocked = qNum > maxAllowedStep;
                                const isCompleted = answers[qNum] !== undefined && !isCurrent;

                                return (
                                    <button 
                                        key={qNum}
                                        onClick={() => !isLocked && jumpToStep(qNum)}
                                        disabled={isLocked}
                                        className={`w-full aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all duration-150 outline-none
                                            ${isCurrent 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10' 
                                                : isCompleted
                                                ? isDark 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer' 
                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 cursor-pointer'
                                                : isLocked
                                                ? isDark 
                                                    ? 'bg-[#1A1A1A] text-slate-600 border border-[#222] opacity-70 cursor-not-allowed' 
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100 opacity-70 cursor-not-allowed'
                                                : isDark 
                                                    ? 'bg-[#222] text-slate-300 border border-[#333] hover:bg-[#333] cursor-pointer' 
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer'
                                            }`}
                                    >
                                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : qNum}
                                    </button>
                                )
                            })}
                        </div>
                        
                        <hr className={`my-6 border-dashed ${isDark ? 'border-[#333]' : 'border-slate-200'}`} />
                        
                        <div className={`flex items-center gap-3 p-4 rounded-xl border ${isDark ? 'bg-[#1A1A1A] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
                            <BrainCircuit className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>AI Engine</p>
                                <p className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    {isAiMode ? "Adapting..." : "Analyzing Base..."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard" className={`w-full shrink-0 h-14 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-colors border shadow-sm ${isDark ? 'bg-[#1A1A1A] border-[#333] text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'}`}>
                        <XCircle className="w-5 h-5" /> Save & Exit
                    </Link>

                    {/* 🔥 FIX: Redesigned Ad 1 (Meet Disha AI) with beautiful internal layout and background sticker */}
                    <div className={`rounded-[1.5rem] p-6 border flex flex-col transition-colors duration-500 relative overflow-hidden mt-auto flex-1 ${isDark ? 'bg-gradient-to-b from-[#111] to-indigo-950/20 border-indigo-500/20' : 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-100 shadow-sm'}`}>
                        <div className="flex items-center gap-3 relative z-10 mb-2">
                            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                <Bot className="w-5 h-5" />
                            </div>
                            <h4 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Meet Disha AI</h4>
                        </div>
                        
                        <p className={`text-xs font-medium leading-relaxed relative z-10 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Got doubts? Talk to your personal AI career voice mentor on your dashboard after completing the test.
                        </p>
                        
                        <div className="flex flex-col gap-2 relative z-10">
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Zap className="w-3 h-3 text-indigo-500"/> 24/7 Voice Support</div>
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><BrainCircuit className="w-3 h-3 text-indigo-500"/> Real-time Answers</div>
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Sparkles className="w-3 h-3 text-indigo-500"/> Gen-Z Relatable</div>
                        </div>

                        <div className="relative z-10 mt-auto pt-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-max inline-block ${isDark ? 'bg-white/10 text-white' : 'bg-indigo-600 text-white'}`}>Available Later</span>
                        </div>

                        {/* Huge Background Sticker */}
                        <Bot className={`absolute -bottom-10 -right-10 w-48 h-48 -rotate-12 opacity-50 ${isDark ? 'text-indigo-500/10' : 'text-indigo-100'}`} />
                        <div className="absolute top-10 -right-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                    </div>

                </aside>

                {/* 🎯 MIDDLE SECTION (Main Question Card) */}
                <main className="flex-1 flex flex-col w-full h-full min-w-0">
                    <div className={`rounded-[2rem] p-6 md:p-10 border shadow-xl relative overflow-x-hidden overflow-y-auto transition-colors duration-500 flex flex-col h-full ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <Zap className="absolute -top-10 -right-10 w-40 h-40 text-indigo-500/5 rotate-12 pointer-events-none" />

                        {loading ? (
                            <div className="flex flex-col items-center justify-center z-10 h-full">
                                <div className={`w-16 h-16 rounded-full border-4 border-t-indigo-500 animate-spin mb-6 ${isDark ? 'border-[#222]' : 'border-indigo-100'}`}></div>
                                <h1 className={`text-xl font-bold animate-pulse text-center ${isDark ? 'text-slate-300' : 'text-indigo-600'}`}>
                                    {isAiMode ? "ML Model is adapting..." : "Fetching next question..."}
                                </h1>
                            </div>
                        ) : (
                            <div className={`z-10 w-full flex flex-col h-full transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
                                
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Question {step}</span>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                            {isAiMode ? <Sparkles className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                            {isAiMode ? currentCluster : currentCategory}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleBack} disabled={history.length === 0} className={`flex items-center justify-center w-10 h-10 rounded-full transition-all outline-none border ${history.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-[#1A1A1A] border-[#333] hover:bg-[#222] text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}>
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={handleForward} disabled={future.length === 0} className={`flex items-center justify-center w-10 h-10 rounded-full transition-all outline-none border ${future.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700 shadow-sm'}`}>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className={`aspect-[21/7] md:aspect-[16/5] shrink-0 w-full rounded-2xl md:rounded-[2rem] overflow-hidden mb-8 border-4 shadow-inner relative flex items-center justify-center ${isDark ? 'border-[#1A1A1A] bg-gradient-to-br from-indigo-900 via-purple-900 to-[#111]' : 'border-slate-50 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100'}`}>
                                    {currentImage && !imageError ? (
                                        <img 
                                            src={currentImage} 
                                            alt="Topic Theme"
                                            onError={() => setImageError(true)} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500" 
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                                            <BrainCircuit className={`w-16 h-16 md:w-20 md:h-20 mb-2 ${isDark ? 'text-indigo-400/50' : 'text-indigo-500/30'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-indigo-400/30' : 'text-indigo-500/30'}`}>
                                                {currentCluster || currentCategory || "ApniDisha"}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#111]/80 to-transparent' : 'from-black/10 to-transparent'}`}></div>
                                </div>

                                <h1 className={`text-2xl md:text-3xl font-extrabold leading-tight mb-2 shrink-0 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {currentQuestion}
                                </h1>

                                <div className="w-full">
                                    {renderInputArea()}
                                </div>

                                <div className={`mt-auto pt-6 flex justify-start items-center w-full border-t shrink-0 ${isDark ? 'border-[#222]' : 'border-slate-100'}`}>
                                    <button 
                                        onClick={handleBack} 
                                        disabled={history.length === 0} 
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none ${history.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'hover:bg-[#222] text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Previous Question
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* 🎯 RIGHT SIDEBAR */}
                <aside className="w-full xl:w-80 flex flex-col gap-4 h-full">
                    
                    <div className={`rounded-[1.5rem] p-6 border shadow-sm flex flex-col items-center shrink-0 transition-colors duration-500 ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <h3 className={`font-extrabold text-sm mb-5 w-full text-left uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Progress</h3>
                        
                        <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center mb-6">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="transparent" stroke={isDark ? "#1A1A1A" : "#F1F5F9"} strokeWidth="8" />
                                <circle 
                                    cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="8" 
                                    strokeDasharray="251" strokeDashoffset={251 - (251 * (progressPercentage / 100))} strokeLinecap="round" 
                                    className="transition-all duration-700 ease-out"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {progressPercentage}%
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 w-full">
                            <div className={`flex-1 text-center p-2 rounded-lg border ${isDark ? 'bg-[#1A1A1A] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
                                <span className={`text-xl md:text-2xl font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{answeredCount}</span>
                                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ANSWERED</p>
                            </div>
                            <div className={`flex-1 text-center p-2 rounded-lg border ${isDark ? 'bg-[#1A1A1A] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
                                <span className={`text-xl md:text-2xl font-black ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>{totalQuestions}</span>
                                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>TOTAL</p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-[1.5rem] p-5 border shadow-sm flex items-center justify-between shrink-0 transition-colors duration-500 ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                <Timer className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={`font-extrabold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Time Elapsed</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No rush, take time.</p>
                            </div>
                        </div>
                        <div className={`font-mono text-xl font-black tracking-tight tabular-nums flex items-baseline ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatTime(timeElapsed).m}<span className={`text-[10px] font-bold mx-0.5 mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>m</span>
                            {formatTime(timeElapsed).s}<span className={`text-[10px] font-bold ml-0.5 mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>s</span>
                        </div>
                    </div>

                    {/* 🔥 FIX: Redesigned Ad 2 (College Predictor) with beautiful internal layout and background sticker */}
                    <div className={`rounded-[1.5rem] p-6 border flex flex-col transition-colors duration-500 relative overflow-hidden mt-auto flex-1 ${isDark ? 'bg-gradient-to-b from-[#111] to-emerald-950/20 border-emerald-500/20' : 'bg-gradient-to-b from-emerald-50/50 to-white border-emerald-100 shadow-sm'}`}>
                        <div className="flex items-center gap-3 relative z-10 mb-2">
                            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h4 className={`font-black text-sm uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>College Predictor</h4>
                        </div>
                        
                        <p className={`text-xs font-medium leading-relaxed relative z-10 mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Discover top government and private colleges perfectly matched to your final career profile.
                        </p>
                        
                        <div className="flex flex-col gap-2 relative z-10">
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Activity className="w-3 h-3 text-emerald-500"/> Smart Cutoff Analysis</div>
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><GraduationCap className="w-3 h-3 text-emerald-500"/> 5000+ Institutions</div>
                            <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Target className="w-3 h-3 text-emerald-500"/> Accurate Matching</div>
                        </div>

                        <div className="relative z-10 mt-auto pt-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg w-max inline-block ${isDark ? 'bg-white/10 text-white' : 'bg-emerald-600 text-white'}`}>Unlocks Automatically</span>
                        </div>

                        {/* Huge Background Sticker */}
                        <GraduationCap className={`absolute -bottom-12 -right-12 w-48 h-48 -rotate-12 opacity-50 ${isDark ? 'text-emerald-500/10' : 'text-emerald-100'}`} />
                        <div className="absolute top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
                    </div>

                </aside>

            </div>
        </div>
    );
}