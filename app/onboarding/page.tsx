"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, BrainCircuit, Sun, Moon, Sparkles, Activity, Timer, XCircle, Lock, Zap } from "lucide-react";

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
    const [uiType, setUiType] = useState("slider"); 
    const [sliderValue, setSliderValue] = useState(3);
    const [currentImage, setCurrentImage] = useState(""); 

    const [history, setHistory] = useState<any[]>([]);
    const [future, setFuture] = useState<any[]>([]);
    
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const totalQuestions = 20;

    const motivationPhrases = [
        "You're making great progress! Each answer brings you closer to your ideal career.",
        "Think carefully! Honest answers reveal your truest self.",
        "Almost done! Your professional journey is about to get clear.",
        "Did you know? Knowing what you hate doing is just as important as knowing what you love."
    ];

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
                    setUiType(data.ui_type || "stars"); 
                    setCurrentImage(data.image_url || "");
                    
                    setSliderValue(answers[data.step] || 3);
                    
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

        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
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
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
        
        setFuture([currentState, ...future]);
        setHistory(history.slice(0, -1));
        
        setStep(previousState.step);
        setScores(previousState.scores);
        setCurrentQuestion(previousState.currentQuestion);
        setCurrentCategory(previousState.currentCategory);
        setCurrentCluster(previousState.currentCluster);
        setIsAiMode(previousState.isAiMode);
        setClusterPrefs(previousState.clusterPrefs);
        setUiType(previousState.uiType);
        setCurrentImage(previousState.currentImage);
        
        setSliderValue(answers[previousState.step] || 3);
    };

    const handleForward = () => {
        if (future.length === 0) return;
        const nextState = future[0];
        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
        
        setHistory([...history, currentState]);
        setFuture(future.slice(1));
        
        setStep(nextState.step);
        setScores(nextState.scores);
        setCurrentQuestion(nextState.currentQuestion);
        setCurrentCategory(nextState.currentCategory);
        setCurrentCluster(nextState.currentCluster);
        setIsAiMode(nextState.isAiMode);
        setClusterPrefs(nextState.clusterPrefs);
        setUiType(nextState.uiType);
        setCurrentImage(nextState.currentImage);

        setSliderValue(answers[nextState.step] || 3);
    };

    const renderInputArea = () => {
        const savedAnswer = answers[step]; 

        if (uiType === "emojis") {
            return (
                <div className="flex justify-between w-full mt-6 md:px-8">
                    {[
                        { val: 1, emoji: "😡", label: "Hate it" },
                        { val: 2, emoji: "😟", label: "Dislike" },
                        { val: 3, emoji: "😐", label: "Neutral" },
                        { val: 4, emoji: "🙂", label: "Like it" },
                        { val: 5, emoji: "🤩", label: "Love it!" }
                    ].map(item => {
                        const isSelected = savedAnswer === item.val;
                        return (
                            <button 
                                key={item.val} 
                                onClick={() => handleAnswer(item.val)} 
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-300 outline-none group
                                    ${isSelected 
                                        ? isDark ? 'bg-indigo-500/20 border border-indigo-500/50 scale-110' : 'bg-indigo-50 border border-indigo-400 scale-110 shadow-sm'
                                        : isDark ? 'border border-transparent hover:bg-[#1A1A1A]' : 'border border-transparent hover:bg-slate-50'
                                    }
                                `}
                            >
                                <span className={`text-4xl md:text-5xl transform transition-transform duration-300 ${!isSelected && 'group-hover:scale-110 group-hover:-translate-y-2'}`}>
                                    {item.emoji}
                                </span>
                                <span className={`text-xs font-bold transition-colors ${isSelected ? (isDark ? 'text-indigo-400' : 'text-indigo-700') : (isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-indigo-600')}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            );
        }

        if (uiType === "mcq") {
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
        }

        if (uiType === "slider") {
            return (
                <div className="w-full mt-6 flex flex-col items-center px-4 md:px-12">
                    <input 
                        type="range" min="1" max="5" step="1" 
                        value={sliderValue} onChange={(e) => setSliderValue(parseInt(e.target.value))}
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer accent-indigo-600 outline-none ${isDark ? 'bg-[#2A2A2A]' : 'bg-slate-200'}`}
                    />
                    <div className={`flex justify-between w-full text-xs mt-6 font-black tracking-wider transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>STRONGLY DISAGREE</span>
                        <span>NEUTRAL</span>
                        <span>STRONGLY AGREE</span>
                    </div>
                    <button onClick={() => handleAnswer(sliderValue)} className={`mt-10 px-12 py-4 rounded-xl font-black transition-all w-full md:w-auto shadow-lg outline-none active:scale-95 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}>
                        Confirm & Continue
                    </button>
                </div>
            );
        }

        return (
            <div className="mt-6">
                <div className="flex gap-3 sm:gap-4 justify-center md:justify-between">
                    {[1, 2, 3, 4, 5].map(star => {
                        const isSelected = savedAnswer === star;
                        return (
                            <button 
                                key={star} 
                                onClick={() => handleAnswer(star)} 
                                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl text-xl font-black transition-all duration-200 border-2 flex items-center justify-center outline-none
                                    ${isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-110'
                                        : isDark ? 'bg-[#141414] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border-[#2A2A2A] hover:border-indigo-500' : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-100 hover:border-indigo-400 shadow-sm hover:shadow-md'
                                    }
                                `}
                            >
                                {star}
                            </button>
                        )
                    })}
                </div>
                <div className={`flex justify-between mt-6 text-[10px] md:text-xs font-bold tracking-wider px-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="uppercase">Strongly Dislike</span>
                    <span className="uppercase">Strongly Like</span>
                </div>
            </div>
        );
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return { m: m.toString().padStart(2, '0'), s: s.toString().padStart(2, '0') };
    };

    if (!mounted) return null;

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
                    <span className={`text-sm font-semibold hidden md:block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Need Help?</span>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 border border-indigo-200">
                        {user?.firstName?.charAt(0) || "P"}
                    </div>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row flex-1 p-4 md:p-6 gap-5 max-w-[1400px] mx-auto w-full xl:h-[calc(100vh-100px)] items-stretch">
                
                <aside className={`w-full xl:w-64 rounded-[1.5rem] border p-6 flex flex-col shadow-sm transition-colors duration-500 h-full overflow-y-auto ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                    <div className="flex-1">
                        <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Questions</h3>
                        
                        <div className="grid grid-cols-5 xl:grid-cols-4 gap-2 md:gap-3">
                            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((qNum) => {
                                const isCompleted = qNum < step;
                                const isCurrent = qNum === step;
                                const isLocked = qNum > step;

                                return (
                                    <div 
                                        key={qNum}
                                        className={`w-full aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all duration-150
                                            ${isCurrent 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10' 
                                                : isCompleted
                                                ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : isDark ? 'bg-[#1A1A1A] text-slate-600 border border-[#222]' : 'bg-slate-50 text-slate-400 border border-slate-100 opacity-70'
                                            }`}
                                    >
                                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : qNum}
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-[#222]' : 'border-slate-100'}`}>
                            <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-[#1A1A1A]' : 'bg-slate-50'}`}>
                                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                                <div>
                                    <p className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>AI Engine</p>
                                    <p className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        {isAiMode ? "Adapting..." : "Analyzing Base..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard" className={`w-full mt-6 shrink-0 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-colors ${isDark ? 'bg-[#1A1A1A] text-slate-400 hover:bg-rose-500/10 hover:text-rose-400' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`}>
                        <XCircle className="w-4 h-4" /> Save & Exit
                    </Link>
                </aside>

                <main className="flex-1 flex flex-col w-full h-full min-w-0">
                    <div className={`rounded-[2rem] p-6 md:p-10 border shadow-xl relative overflow-y-auto transition-colors duration-500 flex flex-col h-full ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <Zap className="absolute -top-10 -right-10 w-40 h-40 text-indigo-500/5 rotate-12 pointer-events-none" />

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center z-10 py-12">
                                <div className={`w-16 h-16 rounded-full border-4 border-t-indigo-500 animate-spin mb-6 ${isDark ? 'border-[#222]' : 'border-indigo-100'}`}></div>
                                <h1 className={`text-xl font-bold animate-pulse text-center ${isDark ? 'text-slate-300' : 'text-indigo-600'}`}>
                                    {isAiMode ? "ML Model is adapting..." : "Fetching next question..."}
                                </h1>
                            </div>
                        ) : (
                            <div className="z-10 animate-in fade-in duration-300 w-full flex flex-col flex-1">
                                
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Question {step}</span>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                            {isAiMode ? <Sparkles className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                            {isAiMode ? currentCluster : currentCategory}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleBack} disabled={history.length === 0} className={`flex items-center justify-center w-10 h-10 rounded-full transition-all outline-none ${history.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-[#222] hover:bg-[#333] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={handleForward} disabled={future.length === 0} className={`flex items-center justify-center w-10 h-10 rounded-full transition-all outline-none ${future.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className={`aspect-[21/7] md:aspect-[16/5] shrink-0 w-full rounded-2xl md:rounded-[2rem] overflow-hidden mb-8 border-4 shadow-inner relative flex items-center justify-center ${isDark ? 'border-[#1A1A1A] bg-gradient-to-br from-indigo-900 via-purple-900 to-[#111]' : 'border-slate-50 bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100'}`}>
                                    {currentImage ? (
                                        <img 
                                            src={currentImage} 
                                            alt="Topic Theme" 
                                            className="absolute inset-0 w-full h-full object-cover opacity-90" 
                                        />
                                    ) : (
                                        <BrainCircuit className={`w-16 h-16 md:w-20 md:h-20 ${isDark ? 'text-white/10' : 'text-indigo-500/10'}`} />
                                    )}
                                    <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#111]/80 to-transparent' : 'from-black/10 to-transparent'}`}></div>
                                </div>

                                <h1 className={`text-2xl md:text-3xl font-extrabold leading-tight mb-2 shrink-0 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {currentQuestion}
                                </h1>

                                <div className="mt-auto w-full">
                                    {renderInputArea()}
                                </div>

                                <div className={`mt-6 pt-6 flex justify-start items-center w-full border-t shrink-0 ${isDark ? 'border-[#222]' : 'border-slate-100'}`}>
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

                <aside className="w-full xl:w-80 flex flex-col gap-5 h-full overflow-y-auto">
                    
                    <div className={`rounded-[1.5rem] p-6 border shadow-sm flex flex-col items-center shrink-0 transition-colors duration-500 ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <h3 className={`font-extrabold text-sm mb-5 w-full text-left ${isDark ? 'text-white' : 'text-slate-900'}`}>Test Progress</h3>
                        <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center mb-4">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle 
                                    cx="50" cy="50" r="40" 
                                    fill="transparent" 
                                    stroke={isDark ? "#1A1A1A" : "#F1F5F9"} 
                                    strokeWidth="8" 
                                />
                                <circle 
                                    cx="50" cy="50" r="40" 
                                    fill="transparent" 
                                    stroke="#10B981" 
                                    strokeWidth="8" 
                                    strokeDasharray="251" 
                                    strokeDashoffset={251 - (251 * ((step - 1) / totalQuestions))} 
                                    strokeLinecap="round" 
                                    className="transition-all duration-700 ease-out"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {Math.round(((step - 1) / totalQuestions) * 100)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full">
                            <div className={`flex-1 text-center p-2 rounded-lg border ${isDark ? 'bg-[#1A1A1A] border-[#222]' : 'bg-slate-50 border-slate-100'}`}>
                                <span className={`text-xl md:text-2xl font-black ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{step > 1 ? step - 1 : 0}</span>
                                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ANSWERED</p>
                            </div>
                            <div className={`flex-1 text-center p-2 rounded-lg border ${isDark ? 'bg-[#1A1A1A] border-[#222]' : 'bg-slate-50 border-slate-100'}`}>
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
                        <div className={`font-mono text-2xl font-black tracking-tight tabular-nums flex items-baseline ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatTime(timeElapsed).m}<span className={`text-xs font-bold mx-0.5 mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>m</span>
                            {formatTime(timeElapsed).s}<span className={`text-xs font-bold ml-0.5 mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>s</span>
                        </div>
                    </div>

                    <div className={`rounded-[1.5rem] p-6 border shadow-sm relative overflow-hidden flex flex-col flex-1 transition-colors duration-500 min-h-[200px] ${isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-slate-100'}`}>
                        <BrainCircuit className={`absolute -bottom-10 -left-10 w-40 h-40 -rotate-12 ${isDark ? 'text-amber-500/5' : 'text-amber-500/10'}`} />
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`flex items-center gap-3 mb-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                <Sparkles className="w-6 h-6" />
                                <h3 className={`font-extrabold text-base md:text-lg leading-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Your Roadmap<br/>Depends On This!</h3>
                            </div>
                            <p className={`text-xs md:text-sm font-medium leading-relaxed p-4 rounded-xl border mt-auto ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-slate-300' : 'bg-amber-50 border-amber-100 text-slate-700'}`}>
                                {motivationPhrases[(step - 1) % motivationPhrases.length]}
                            </p>
                        </div>
                    </div>
                    
                </aside>

            </div>
        </div>
    );
}