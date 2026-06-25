import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Trophy, LayoutDashboard, GitMerge, UserPlus, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PCH Cup Volleyball Tournament",
  description: "Real-time match standings, brackets, and participant draw for PCH Cup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-900 text-slate-50 antialiased selection:bg-blue-500/30`}>
        {/* Background gradient effects */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/0 to-slate-900/0"></div>

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
              <Link href="/" className="flex items-center gap-2 text-slate-300 transition-colors hover:text-blue-400">
                <LayoutDashboard className="h-4 w-4" /> Standings
              </Link>
              <Link href="/bracket" className="flex items-center gap-2 text-slate-300 transition-colors hover:text-blue-400">
                <GitMerge className="h-4 w-4" /> Bracket
              </Link>
              <Link href="/draw" className="flex items-center gap-2 text-slate-300 transition-colors hover:text-blue-400">
                <UserPlus className="h-4 w-4" /> Draw
              </Link>
              <Link href="/admin" className="flex items-center gap-2 rounded-md bg-slate-800/80 px-3 py-1.5 text-slate-300 transition-all hover:bg-slate-700 hover:text-white border border-slate-700/50">
                <Settings className="h-4 w-4" /> Admin
              </Link>
            </div>
            {/* Mobile Menu Button - simplify for now */}
            <div className="md:hidden">
              <Link href="/admin" className="p-2 text-slate-300">
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile bottom nav */}
        <div className="md:hidden glass-panel fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-slate-700/50 pb-safe pt-2">
           <Link href="/" className="flex flex-col items-center p-2 text-xs text-slate-400 hover:text-blue-400">
             <LayoutDashboard className="mb-1 h-5 w-5" />
             Standings
           </Link>
           <Link href="/bracket" className="flex flex-col items-center p-2 text-xs text-slate-400 hover:text-blue-400">
             <GitMerge className="mb-1 h-5 w-5" />
             Bracket
           </Link>
           <Link href="/draw" className="flex flex-col items-center p-2 text-xs text-slate-400 hover:text-blue-400">
             <UserPlus className="mb-1 h-5 w-5" />
             Draw
           </Link>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mb-20 md:mb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
