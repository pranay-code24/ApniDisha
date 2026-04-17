"use client";

import { useState, useEffect} from "react";
import { Loader2, PhoneCall } from "lucide-react";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";

let globalVapiInstance: any = null;

export default function VoiceMentorCall() {
    const [isCalling, setIsCalling] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSetup, setIsSetup] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initVapi = async () => {
            try {
                if (!globalVapiInstance) {
                    const Vapi = (await import("@vapi-ai/web")).default;
                    globalVapiInstance = new Vapi(VAPI_PUBLIC_KEY);
                }

                if (mounted) {
                    globalVapiInstance.removeAllListeners();

                    globalVapiInstance.on("call-start", () => {
                        setIsConnecting(false);
                        setIsCalling(true);
                    });

                    globalVapiInstance.on("call-end", () => {
                        setIsCalling(false);
                        setIsConnecting(false);
                    });

                    globalVapiInstance.on("error", (e: any) => {
                        console.error("Vapi Error Event:", e);
                        setIsConnecting(false);
                        setIsCalling(false);
                    });

                    setIsSetup(true);
                }
            } catch (error) {
                console.error("Failed to load Vapi SDK:", error);
            }
        };

        initVapi();

        return () => {
            mounted = false;
        };
    }, []);

    const toggleCall = async () => {
        if (!globalVapiInstance || !isSetup) return;

        if (isCalling) {
            globalVapiInstance.stop();
        } else {
            setIsConnecting(true);
            try {
                await globalVapiInstance.start(ASSISTANT_ID);
            } catch (err) {
                console.error("Mic access denied or connection failed:", err);
                setIsConnecting(false);
            }
        }
    };

    return (
        <button 
            onClick={toggleCall}
            disabled={isConnecting || !isSetup}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isCalling 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            } disabled:opacity-50`}
        >
            {isConnecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : isCalling ? (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span> End Call</>
            ) : (
                <><PhoneCall className="w-4 h-4" /> Call AI Mentor</>
            )}
        </button>
    );
}