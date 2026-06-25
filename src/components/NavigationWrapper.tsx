"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, GitMerge, UserPlus, Settings, Smartphone } from "lucide-react";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isEmbed, setIsEmbed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check url search params on client side
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsEmbed(params.get("embed") === "true");
    }
  }, []);

  if (isEmbed) {
    return <main className="p-4">{children}</main>;
  }

  const navItems = [
    { href: "/", label: "Standings", icon: LayoutDashboard },
    { href: "/bracket", label: "Bracket", icon: GitMerge },
    { href: "/draw", label: "Draw", icon: UserPlus },
    { href: "/simulator", label: "Device Simulator", icon: Smartphone },
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav className="glass-panel sticky top-0 z-50 w-full border-b border-slate-700/50 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-2 shadow-lg shadow-blue-500/20">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <Link href="/" className="text-xl font-bold tracking-tight text-white transition-colors hover:text-blue-400">
              PCH Cup <span className="text-blue-500">2026</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 transition-colors ${
                    isActive ? "text-blue-400 font-semibold" : "text-slate-300 hover:text-blue-400"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all border ${
                pathname === "/admin"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700/50"
              }`}
            >
              <Settings className="h-4 w-4" /> Admin
            </Link>
          </div>
          
          {/* Mobile Admin Button */}
          <div className="md:hidden">
            <Link href="/admin" className="p-2 text-slate-300">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden glass-panel fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-slate-700/50 pb-safe pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 text-xs transition-colors ${
                isActive ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-blue-400"
              }`}
            >
              <Icon className="mb-1 h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mb-20 md:mb-0">
        {children}
      </main>
    </>
  );
}
