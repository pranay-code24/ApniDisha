"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { BrainCircuit, Target, Sun, Moon, Zap, Download, FileText, BookOpen, GraduationCap, Briefcase, Trophy, LayoutDashboard, Compass, History, Clock, Lock, Sparkles, ArrowRight, LogOut, Loader2, X, MessageSquare, Send, Bot, PlayCircle, Award, ExternalLink, Flame, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import VoiceMentorCall from "../components/VoiceMentorCall";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [isDark, setIsDark] = useState(false); 
  const [mounted, setMounted] = useState(false);
  
  const [hasTest, setHasTest] = useState(true);
  const [topCluster, setTopCluster] = useState("Analyzing...");
  const [confidenceScore, setConfidenceScore] = useState("0.0");
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [readinessScore, setReadinessScore] = useState(0);
  const [isProfileDone, setIsProfileDone] = useState(0);
  const [isTestDone, setIsTestDone] = useState(0);

  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{title: string, matchPercentage: number} | null>(null);
  
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("India"); 
  const [filteredColleges, setFilteredColleges] = useState<any[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [searchLevelMsg, setSearchLevelMsg] = useState("");

  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapUnlocked, setRoadmapUnlocked] = useState(false);
  
  const [showResources, setShowResources] = useState(false);
  const [aiResources, setAiResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const [showChallenge, setShowChallenge] = useState(false);
  const [aiChallenge, setAiChallenge] = useState<any>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    if (!isLoaded || !user) return; 

    setMounted(true);
    const userId = user.id;

    const savedResult = localStorage.getItem(`apnidisha_final_cluster_${userId}`);
    
    if (!savedResult) {
      setHasTest(false);
      return; 
    }

    const savedJobs = localStorage.getItem(`apnidisha_recommended_jobs_${userId}`);
    const realConfidenceScore = localStorage.getItem(`apnidisha_confidence_score_${userId}`);
    
    setTopCluster(savedResult);
    setConfidenceScore(realConfidenceScore && realConfidenceScore !== "null" ? realConfidenceScore : "94.2");

    if (savedJobs) {
      try {
        setRecommendedJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.error("Error parsing jobs", e);
      }
    }

    const historyStr = localStorage.getItem(`apnidisha_test_history_${userId}`);
    let parsedHistory = [];
    if (historyStr) {
        parsedHistory = JSON.parse(historyStr);
        setTestHistory(parsedHistory);
    } else {
        parsedHistory = [{ cluster: savedResult, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), attempt: 1 }];
        setTestHistory(parsedHistory);
    }

    const hasProfileData = localStorage.getItem(`apnidisha_user_grade_${userId}`) ? 1 : 0;
    const hasTestCompleted = savedResult ? 1 : 0;

    setIsProfileDone(hasProfileData);
    setIsTestDone(hasTestCompleted);
    setReadinessScore(((hasProfileData + hasTestCompleted) / 2) * 100);

    fetchColleges("", savedResult);

    const accepted = localStorage.getItem(`apnidisha_challenge_accepted_${userId}`);
    if (accepted === "true") setChallengeAccepted(true);

  }, [router, isLoaded, user]);

  const shareMessage = `Hi, I have finded my perfect career pathway through ApniDisha AI assessment : *${topCluster}* with confidence score ${confidenceScore}%.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      window.print();
      setIsDownloading(false);
    }, 800);
  };

  const fetchColleges = async (cityQuery: string, cluster: string) => {
    setLoadingColleges(true);
    setSearchLevelMsg("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-colleges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityQuery || "Indore", state: "Madhya Pradesh", cluster: cluster })
      });
      const data = await response.json();
      if (data.success) {
        setFilteredColleges(data.colleges);
        setActiveLocation(cityQuery ? cityQuery.toUpperCase() : "INDORE");
        if (data.search_level === "State") setSearchLevelMsg(`No exact matches in ${cityQuery}. Showing best options across Madhya Pradesh.`);
        else if (data.searchLevel === "National") setSearchLevelMsg(`Showing top national institutes for this specialization.`);
      }
    } catch (error) {
      console.error("Failed to fetch colleges", error);
    }
    setLoadingColleges(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchColleges(searchQuery, topCluster);
  };

  const unlockRoadmap = async () => {
    setLoadingRoadmap(true);
    setRoadmapUnlocked(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster: topCluster })
      });
      const data = await response.json();
      if (data.success) setRoadmap(data.roadmap);
    } catch (error) {
      console.error("Failed to load roadmap", error);
    }
    setLoadingRoadmap(false);
  };

  const openJobModal = async (job: any) => {
    setSelectedJob(job);
    setJobDetails(null); 
    setLoadingJobDetails(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/job-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: job.title, cluster: topCluster })
      });
      const data = await response.json();
      if (data.success) {
        setJobDetails(data.details);
      }
    } catch (error) {
      console.error("Failed to fetch job details", error);
    }
    setLoadingJobDetails(false);
  };

  const fetchRealtimeResources = async (retryCount = 0) => {
    setShowResources(true);
    if (aiResources.length > 0) return; 

    setLoadingResources(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster: topCluster })
      });
      const data = await response.json();
      
      if (data && data.success && data.resources) {
        setAiResources(data.resources);
      } else {
        throw new Error("Invalid resource format");
      }
    } catch (error) {
      console.error("Attempt", retryCount, "failed:", error);
      if (retryCount < 2) {
        console.log("Retrying resources silently...");
        setTimeout(() => fetchRealtimeResources(retryCount + 1), 1500);
        return;
      }
    }
    setLoadingResources(false);
  };

  const fetchRealtimeChallenge = async (retryCount = 0) => {
    setShowChallenge(true);
    if (aiChallenge) return; 

    setLoadingChallenge(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster: topCluster })
      });
      
      const data = await response.json();
      
      if (data && data.success && data.challenge) {
        setAiChallenge(data.challenge);
      } else {
        throw new Error("Invalid format from AI");
      }
      
    } catch (error) {
      console.error("Attempt", retryCount, "failed:", error);
      if (retryCount < 2) {
        console.log("Retrying silently...");
        setTimeout(() => fetchRealtimeChallenge(retryCount + 1), 1500);
        return; 
      }
    }
    setLoadingChallenge(false);
  };

  const handleAcceptChallenge = () => {
    confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#059669', '#F59E0B'],
        zIndex: 200 
    });

    setChallengeAccepted(true);
    
    if (user) {
        localStorage.setItem(`apnidisha_challenge_accepted_${user.id}`, "true");
    }

    setTimeout(() => {
        setShowChallenge(false);
    }, 1500);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const newMsg = { role: "user", content: chatMessage };
    setChatHistory([...chatHistory, newMsg]);
    setChatMessage("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatMessage,
          cluster: topCluster,
          history: chatHistory
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    }
    setIsChatLoading(false);
  };

  const getPhaseIcon = (index: number) => {
    switch(index) {
      case 0: return <BookOpen className="w-5 h-5" />;
      case 1: return <GraduationCap className="w-5 h-5" />;
      case 2: return <Briefcase className="w-5 h-5" />;
      case 3: return <Trophy className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const displayedHistory = showAllHistory ? testHistory : testHistory.slice(0, 3);

  if (!mounted) return null;

  if (!hasTest) {
      return (
          <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
              <div className={`p-10 rounded-[2rem] border shadow-xl text-center max-w-md ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      <BrainCircuit className="w-10 h-10" />
                  </div>
                  <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Data Found</h2>
                  <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>You haven't taken the AI Career Test yet. Discover your path now!</p>
                  <Link href="/onboarding" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                      Take AI Test <ArrowRight className="w-5 h-5" />
                  </Link>
                  <div className="mt-4">
                      <SignOutButton redirectUrl="/">
                          <button className="text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors">Logout</button>
                      </SignOutButton>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className={`flex h-screen print:h-auto overflow-hidden print:overflow-visible print:block font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-slate-200' : 'bg-[#f4f6f8] text-slate-900'}`}>
      
      <aside className={`w-20 lg:w-64 flex flex-col justify-between border-r transition-colors print:hidden shrink-0 ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-transparent">
            <img 
              src="/image.jpeg" 
              alt="Apni Disha Icon" 
              className="w-10 h-10 lg:hidden mx-auto rounded-lg object-contain" 
            />
            
            <div className="hidden lg:flex items-center gap-3">
              <img 
                src="/image.jpeg" 
                alt="Apni Disha Logo" 
                className="w-12 h-12 rounded-xl object-contain shadow-sm" 
              />
              <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Apni<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Disha</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 mt-4">
            <button className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDark ? 'bg-[#222] text-white' : 'bg-indigo-50 text-indigo-600'}`}>
              <LayoutDashboard className="w-5 h-5 mx-auto lg:mx-0" />
              <span className="hidden lg:block font-bold text-sm">Dashboard</span>
            </button>
            <Link href="/onboarding" className={`flex items-center gap-3 p-3 rounded-xl transition-all outline-none ${isDark ? 'text-slate-400 hover:bg-[#1A1A1A] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Compass className="w-5 h-5 mx-auto lg:mx-0" />
              <span className="hidden lg:block font-bold text-sm">Retake Test</span>
            </Link>
          </div>
        </div>

        <div className={`p-4 border-t flex flex-col gap-2 items-center lg:items-start ${isDark ? 'border-[#2A2A2A]' : 'border-slate-200'}`}>
          <button onClick={() => setIsDark(!isDark)} className={`p-2 w-full flex justify-center lg:justify-start items-center gap-3 rounded-xl transition-colors outline-none ${isDark ? 'hover:bg-[#222] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="hidden lg:block font-bold text-sm">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          
          <div className="w-full">
            <SignOutButton redirectUrl="/">
              <button className={`p-2 w-full flex justify-center lg:justify-start items-center gap-3 rounded-xl transition-colors outline-none text-rose-500 hover:bg-rose-50 ${isDark ? 'hover:bg-rose-500/10' : ''}`}>
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:block font-bold text-sm">Logout</span>
              </button>
            </SignOutButton>
          </div>

          <div className="flex items-center gap-3 w-full p-2 mt-2">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 lg:w-10 lg:h-10" } }} />
            <div className="hidden lg:block overflow-hidden">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.firstName || "Explorer"}</p>
                <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto print:overflow-visible p-4 lg:p-8 relative scroll-smooth">
        
        <div className="flex justify-between items-center mb-8 print:mt-8">
            <div>
                <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome back, {user?.firstName || "Pranay"} 👋</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Here is your personalized career ecosystem.</p>
            </div>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm disabled:opacity-70 print:hidden shrink-0">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                {isDownloading ? "Exporting..." : "Export"}
            </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-8 print:hidden">
            {[
                { title: "AI Prediction", icon: <Target className="w-5 h-5"/>, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400", targetId: "section-prediction" },
                { title: "Top Roles", icon: <Briefcase className="w-5 h-5"/>, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400", targetId: "section-roles" },
                { title: "Colleges", icon: <GraduationCap className="w-5 h-5"/>, color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400", targetId: "section-colleges" },
                { title: "Roadmap", icon: <FileText className="w-5 h-5"/>, color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400", targetId: "section-roadmap" }
            ].map((cat, i) => (
                <div key={i} onClick={() => scrollToSection(cat.targetId)} className={`flex items-center gap-3 py-3 px-5 rounded-2xl border cursor-pointer transition-transform hover:-translate-y-1 ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className={`p-2 rounded-xl ${cat.color}`}>{cat.icon}</div>
                    <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{cat.title}</span>
                </div>
            ))}
        </div>

        <div id="section-prediction" className="mb-8 pt-4">
            <h2 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Latest Assessment Result</h2>
            <div className={`p-8 rounded-[2rem] border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#111] to-[#0a0a0a] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 relative z-10 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                    <Zap className="w-3.5 h-3.5" /> Best Match
                </div>
                <h3 className={`text-3xl md:text-4xl font-black mb-4 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{topCluster}</h3>
                <div className="flex items-end gap-6 mt-4 relative z-10">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{confidenceScore}%</span>
                    <span className={`text-sm font-medium pb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Confidence Score</span>
                    <a 
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg ${
                            isDark 
                            ? 'bg-[#25D366] text-white hover:bg-[#20ba5a]' 
                            : 'bg-[#25D366] text-white hover:bg-[#20ba5a]'
                        }`}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.222-3.607c1.487.882 3.033 1.349 4.625 1.35h.005c5.454 0 9.893-4.438 9.896-9.891.002-2.641-1.026-5.124-2.896-6.995s-4.355-2.898-6.996-2.898c-5.454 0-9.894 4.439-9.897 9.892-.001 1.696.43 3.344 1.248 4.794l-1.07 3.907 4.005-1.052z"/>
                        </svg>
                        Share Result on WhatsApp
                    </a>
                </div>
            </div>
        </div>

        <div id="section-roles" className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8 pt-4">
            <div>
                <h2 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Recommended Roles</h2>
                <div className="flex flex-col gap-3">
                    {recommendedJobs.slice(0, 5).map((job, idx) => (
                        <div key={idx} onClick={() => openJobModal(job)} className={`cursor-pointer p-4 rounded-2xl border flex justify-between items-center transition-all hover:-translate-y-1 ${isDark ? 'bg-[#111] border-[#2A2A2A] hover:border-indigo-500/50' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isDark ? 'bg-[#222] text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{idx+1}</div>
                                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{job.title}</span>
                            </div>
                            <span className={`text-xs font-black px-3 py-1 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>{job.matchPercentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Test History</h2>
                <div className="flex flex-col gap-3">
                    {testHistory.length === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No history found.</p>
                    ) : (
                        <>
                            {displayedHistory.map((test, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${idx !== 0 ? 'opacity-60' : ''} ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div>
                                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{test.cluster}</p>
                                        <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <Clock className="w-3 h-3"/> {test.date} (Attempt {test.attempt})
                                        </p>
                                    </div>
                                    {idx === 0 && (
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>Active</span>
                                    )}
                                </div>
                            ))}
                            {testHistory.length > 3 && (
                                <button 
                                    onClick={() => setShowAllHistory(!showAllHistory)}
                                    className={`w-full py-3 mt-1 rounded-xl border border-dashed font-bold text-xs uppercase tracking-wider transition-colors outline-none ${isDark ? 'border-[#333] text-slate-400 hover:bg-[#222] hover:text-white' : 'border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                                >
                                    {showAllHistory ? "Show Less" : `View All Past Tests (${testHistory.length})`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        <div id="section-colleges" className={`mb-8 p-8 rounded-3xl border pt-8 ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recommended Institutions</h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Showing options for: <span className="font-bold text-indigo-500">{activeLocation}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex gap-2 print:hidden">
                    <input 
                        type="text" 
                        placeholder="Enter City or State..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`px-4 py-2 rounded-xl text-sm border focus:outline-none focus:border-indigo-500 transition-colors ${isDark ? 'bg-black border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                    />
                    <button type="submit" disabled={loadingColleges} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {loadingColleges ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </button>
                </form>
            </div>
            
            {searchLevelMsg && filteredColleges.length > 0 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
                    ℹ️ {searchLevelMsg}
                </div>
            )}

            {filteredColleges.length === 0 && !loadingColleges ? (
                <div className={`p-8 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-500'}`}>
                    No colleges found in this area. Try searching a nearby major city.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingColleges ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className={`p-5 rounded-2xl border animate-pulse ${isDark ? 'bg-white/5 border-[#2A2A2A]' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="h-4 w-3/4 bg-indigo-500/20 rounded mb-2"></div>
                            <div className="h-3 w-1/2 bg-slate-500/20 rounded"></div>
                        </div>
                    ))
                ) : filteredColleges.map((college, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-[#2A2A2A] hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                        <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{college.name}</h4>
                        <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>📍 {college.location}</p>
                        <div className="flex flex-wrap gap-2">
                            {college.courses.map((course: string, cIdx: number) => (
                                <span key={cIdx} className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {course}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        <div id="section-roadmap" className={`mb-8 p-8 md:p-12 rounded-3xl border pt-10 ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-2xl font-bold mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Target className="w-6 h-6 text-indigo-500" /> Your Action Plan to {topCluster}
            </h3>

            {!roadmapUnlocked ? (
                <div className="text-center py-12">
                    <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Unlock your AI-generated step-by-step career timeline.</p>
                    <button onClick={unlockRoadmap} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Generate Roadmap
                    </button>
                </div>
            ) : loadingRoadmap ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="animate-pulse font-medium">AI is generating your custom roadmap...</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-indigo-500/30 ml-4 md:ml-6 space-y-12 pb-4">
                    {roadmap.map((step, index) => (
                    <div key={index} className="relative pl-8 md:pl-10">
                        <div className="absolute -left-[21px] md:-left-[25px] top-0">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center ${isDark ? 'bg-black border-[#111] text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white border-white text-indigo-600 shadow-md'}`}>
                                {getPhaseIcon(index)}
                            </div>
                        </div>
                        <div className="pt-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{step.phase}</span>
                            <h4 className={`text-xl font-bold mt-1 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                            <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="mt-12 mb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Immediate Next Steps</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] flex flex-col ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Start Learning</h4>
                    <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        We've curated the best free courses from YouTube & Coursera for <b>{topCluster}</b>.
                    </p>
                    <div className="mt-auto">
                        <button 
                        onClick={() => fetchRealtimeResources(0)} 
                        className="w-full h-12 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        Explore Resources
                    </button>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] flex flex-col ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Talk to an Expert</h4>
                    <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Confused about the roadmap? Talk to 'Disha' directly in real-time.
                    </p>
                    <div className="mt-auto">
                        <VoiceMentorCall />
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] flex flex-col ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Weekly Challenge</h4>
                    <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Small steps lead to big results. Complete this week's <b>{topCluster}</b> task.
                    </p>
                    <div className="mt-auto">
                        {challengeAccepted ? (
                            <button 
                                onClick={() => setShowChallenge(true)} 
                                className="w-full h-12 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Continue Quest
                            </button>
                        ) : (
                            <button 
                                onClick={() => fetchRealtimeChallenge(0)} 
                                className="w-full h-12 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                            >
                                View Challenge
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className={`mt-16 mb-12 p-8 md:p-12 rounded-[3rem] border border-dashed flex flex-col md:flex-row items-center justify-between gap-8 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="text-center md:text-left">
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Not satisfied with this path?
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    No worries! You can retake the AI assessment to explore a different career cluster.
                </p>
            </div>
            
            <Link 
                href="/onboarding" 
                className="group relative flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-[0_20px_50px_rgba(79,70,229,0.3)] shrink-0"
            >
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping group-hover:block hidden"></div>
                <History className="w-5 h-5" />
                Retake AI Quiz
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

      </main>

      <aside className={`w-80 hidden 2xl:flex flex-col p-6 border-l overflow-y-auto shrink-0 print:hidden ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
        
        <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center relative overflow-hidden mb-6 shadow-sm ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-sm font-bold absolute top-6 left-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Profile Readiness
            </h3>
            
            <div className="relative w-32 h-32 mt-8 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke={isDark ? "#2A2A2A" : "#F1F5F9"} 
                        strokeWidth="8" 
                    />
                    <circle 
                        cx="50" cy="50" r="40" 
                        fill="transparent" 
                        stroke="#10B981" 
                        strokeWidth="8" 
                        strokeDasharray="251" 
                        strokeDashoffset={251 - (251 * (readinessScore / 100))} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {readinessScore}%
                    </span>
                </div>
            </div>

            <div className="w-full space-y-3 mt-2">
                <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTestDone ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Tests Taken</span>
                    </div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{testHistory.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isProfileDone ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Profile Data</span>
                    </div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{isProfileDone}/1</span>
                </div>
            </div>
        </div>

        <div className="relative w-full h-80 rounded-[2rem] overflow-hidden mb-6 flex flex-col justify-end p-6 group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-800 to-black transition-transform duration-700 group-hover:scale-105"></div>
            <div className="relative z-10">
                <Sparkles className="w-8 h-8 text-amber-400 mb-4 opacity-80" />
                <h3 className="text-3xl font-black text-white leading-tight mb-2">The future depends on what you do today.</h3>
                <p className="text-indigo-200 text-sm font-semibold">— ApniDisha</p>
            </div>
        </div>

        <div className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <span className="font-bold text-sm">1-on-1 Mentorship</span>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#2A2A2A]' : 'bg-orange-100 text-orange-500'}`}><Lock className="w-4 h-4"/></div>
        </div>
      </aside>

      {isChatOpen && (
        <div className={`fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden z-50 transition-all print:hidden ${isDark ? 'bg-[#111] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-indigo-600 text-white border-transparent'}`}>
            <div className="flex items-center gap-2">
               <Bot className="w-5 h-5" />
               <span className="font-bold">ApniDisha Guide</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:opacity-70 outline-none">
               <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                  <div className={`text-center text-sm p-4 rounded-xl ${isDark ? 'bg-[#1A1A1A] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      Hi {user?.firstName}! I'm your AI guide. Ask me anything about {topCluster} or your career path.
                  </div>
              )}
              {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? (isDark ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-indigo-100 text-indigo-900 rounded-br-sm') : (isDark ? 'bg-[#222] text-slate-200 rounded-bl-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm')}`}>
                        {msg.content}
                     </div>
                  </div>
              ))}
              {isChatLoading && (
                  <div className="flex justify-start">
                     <div className={`p-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-[#222]' : 'bg-slate-100'}`}>
                         <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                     </div>
                  </div>
              )}
          </div>
          
          <div className={`p-3 border-t flex gap-2 ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200'}`}>
             <input
               type="text"
               value={chatMessage}
               onChange={(e) => setChatMessage(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
               placeholder="Ask about your career..."
               className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none border transition-colors ${isDark ? 'bg-[#222] border-[#333] text-white focus:border-indigo-500' : 'bg-white border-slate-300 focus:border-indigo-500'}`}
             />
             <button onClick={sendMessage} disabled={isChatLoading || !chatMessage.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors outline-none">
               <Send className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedJob(null)}></div>
          <div className={`relative w-full max-w-md min-h-[300px] p-8 rounded-[2rem] border shadow-2xl z-10 ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setSelectedJob(null)} className={`absolute top-5 right-5 p-2 rounded-full ${isDark ? 'hover:bg-[#222] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-5 h-5" />
            </button>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border mb-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <Zap className="w-3.5 h-3.5" /> {selectedJob.matchPercentage}% Profile Match
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedJob.title}</h2>

            {loadingJobDetails ? (
                <div className="py-10 flex flex-col items-center justify-center text-indigo-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="animate-pulse text-sm font-medium">Fetching real-time market data...</p>
                </div>
            ) : jobDetails ? (
                <div className="animate-in fade-in zoom-in duration-300">
                    <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{jobDetails.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-100'}`}>
                        <div>
                          <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Expected Salary Range</h4>
                          <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{jobDetails.salary}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>💰</div>
                      </div>
                    </div>

                    <div>
                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Key Skills Required</h4>
                        <div className="flex flex-wrap gap-2">
                            {jobDetails.skills.map((skill: string, i: number) => (
                                <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isDark ? 'bg-[#222] border-[#333] text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-3 opacity-80" />
                    <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Couldn't load job details.</p>
                    <button onClick={() => openJobModal(selectedJob)} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-200">Try Again</button>
                </div>
            )}
          </div>
        </div>
      )}

      {showResources && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowResources(false)}></div>
          <div className={`relative w-full max-w-lg min-h-[400px] p-8 rounded-[2rem] border shadow-2xl z-10 animate-in zoom-in duration-300 ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setShowResources(false)} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#222] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-5 h-5" />
            </button>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border mb-4 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
              <Zap className="w-3.5 h-3.5" /> AI Curated Resources
            </div>
            
            <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Learning Materials</h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time recommendations for <span className="font-bold text-indigo-500">{topCluster}</span>.</p>

            {loadingResources ? (
                <div className="py-12 flex flex-col items-center justify-center text-indigo-500 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="animate-pulse text-sm font-bold">AI is hunting for the best resources...</p>
                </div>
            ) : aiResources && aiResources.length > 0 ? (
                <div className="space-y-4">
                  {aiResources.map((res, idx) => (
                    <a 
                      key={idx}
                      href={res.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#141414] border-[#2A2A2A] hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${res.platform.toLowerCase().includes('youtube') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {res.platform.toLowerCase().includes('youtube') ? <PlayCircle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{res.title}</h4>
                          <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{res.platform}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{res.desc}</p>
                        </div>
                      </div>
                      <ExternalLink className={`w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    </a>
                  ))}
                </div>
            ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-3 opacity-80" />
                    <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Couldn't fetch resources right now.</p>
                    <button onClick={() => fetchRealtimeResources(0)} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-200">Try Again</button>
                </div>
            )}
          </div>
        </div>
      )}

      {showChallenge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowChallenge(false)}></div>
          <div className={`relative w-full max-w-lg min-h-[350px] max-h-[90vh] overflow-y-auto p-8 rounded-[2rem] border shadow-2xl z-10 animate-in zoom-in duration-300 ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setShowChallenge(false)} className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${isDark ? 'hover:bg-[#222] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-5 h-5" />
            </button>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border mb-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <Flame className="w-3.5 h-3.5" /> 7-Day Micro Quest
            </div>
            
            {loadingChallenge ? (
                <div className="py-16 flex flex-col items-center justify-center text-emerald-500 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="animate-pulse text-sm font-bold text-center">Designing a custom mission<br/>just for you...</p>
                </div>
            ) : aiChallenge ? (
                <>
                  <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{aiChallenge.challenge_title}</h2>
                  <p className={`text-sm font-medium mb-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Goal: {aiChallenge.goal}</p>

                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-emerald-500/20 before:to-transparent">
                    {aiChallenge.tasks.map((task: any, idx: number) => (
                      <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${isDark ? 'bg-[#111] border-[#222] text-emerald-500' : 'bg-white border-slate-100 text-emerald-600'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        
                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{task.day}</div>
                          <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</h4>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{task.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleAcceptChallenge}
                    disabled={challengeAccepted}
                    className={`w-full mt-8 py-3 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${challengeAccepted ? 'bg-emerald-600 opacity-80 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {challengeAccepted ? "Quest Accepted! 🎉" : "Accept Challenge"}
                  </button>
                </>
            ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-10 h-10 text-rose-400 mb-3 opacity-80" />
                    <p className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Failed to generate your quest.</p>
                    <button onClick={() => fetchRealtimeChallenge(0)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-200">Retry Now</button>
                </div>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-40 print:hidden bg-indigo-600 text-white outline-none"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}