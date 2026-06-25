"use client";

import { useState, useRef } from "react";
import { Monitor, Smartphone, RefreshCw, Link2, Link2Off } from "lucide-react";

export default function SimulatorPage() {
  const [syncNav, setSyncNav] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const [iframeKey, setIframeKey] = useState(0);

  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (syncNav) {
      if (desktopIframeRef.current) desktopIframeRef.current.src = `${path}?embed=true`;
      if (mobileIframeRef.current) mobileIframeRef.current.src = `${path}?embed=true`;
    }
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const pages = [
    { name: "🏆 Standings", path: "/" },
    { name: "🌿 Bracket", path: "/bracket" },
    { name: "🎲 Random Draw", path: "/draw" },
    { name: "⚙️ Admin Panel", path: "/admin" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-700/50">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            🖥️📱 Device <span className="text-gradient">Simulator</span>
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Simulate and interact with Desktop Monitor and Mobile Phone layouts in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Page Links */}
          <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700/50">
            {pages.map((page) => (
              <button
                key={page.path}
                onClick={() => handleNavigate(page.path)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  currentPath === page.path
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>

          {/* Sync Toggle */}
          <button
            onClick={() => setSyncNav(!syncNav)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              syncNav
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
            title={syncNav ? "Navigation is synchronized" : "Navigation is independent"}
          >
            {syncNav ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
            <span className="hidden sm:inline">{syncNav ? "Sync On" : "Sync Off"}</span>
          </button>

          {/* Reload Button */}
          <button
            onClick={handleReload}
            className="p-2 rounded-lg bg-slate-850 border border-slate-700 text-slate-350 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Simulator Workspace */}
      <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-12 xl:gap-8 pb-12">
        
        {/* DESKTOP MONITOR MOCKUP */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-slate-350 text-sm font-semibold">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Monitor View (Desktop Layout)</span>
          </div>
          
          {/* Monitor Frame */}
          <div className="relative bg-slate-950 p-4 pb-0 rounded-t-3xl border-4 border-slate-850 shadow-2xl w-[808px] h-[474px] overflow-hidden flex flex-col justify-start">
            {/* Screen Content Wrapper */}
            <div className="relative w-[768px] h-[432px] bg-slate-900 overflow-hidden rounded-lg">
              <div 
                className="absolute origin-top-left"
                style={{
                  width: "1280px",
                  height: "720px",
                  transform: "scale(0.6)", // 1280 * 0.6 = 768px, 720 * 0.6 = 432px
                }}
              >
                <iframe
                  key={`desktop-${iframeKey}`}
                  ref={desktopIframeRef}
                  src={`${currentPath}?embed=true`}
                  className="w-full h-full border-none"
                  title="Desktop Preview"
                />
              </div>
            </div>
          </div>
          {/* Monitor Stand */}
          <div className="w-24 h-8 bg-slate-850 border-x-4 border-slate-800"></div>
          <div className="w-48 h-3 bg-slate-800 rounded-full shadow-lg"></div>
        </div>

        {/* MOBILE PHONE MOCKUP */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-slate-350 text-sm font-semibold">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>Phone View (Mobile Layout)</span>
          </div>

          {/* Smartphone Frame */}
          <div className="relative bg-slate-950 p-3.5 pt-10 rounded-[44px] border-4 border-slate-800 shadow-2xl w-[320px] h-[580px] flex flex-col justify-start">
            {/* Screen Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-950 rounded-b-xl z-20 flex justify-center items-center">
              <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
            </div>
            
            {/* Screen Content Wrapper */}
            <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-[30px] border border-slate-850/50">
              <iframe
                key={`mobile-${iframeKey}`}
                ref={mobileIframeRef}
                src={`${currentPath}?embed=true`}
                className="w-full h-full border-none"
                title="Mobile Preview"
              />
            </div>
          </div>
          {/* Home indicator base shadow */}
          <div className="w-32 h-1 bg-slate-850 rounded-full mt-4"></div>
        </div>

      </div>
    </div>
  );
}
