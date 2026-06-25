import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavigationWrapper from "@/components/NavigationWrapper";

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

        <NavigationWrapper>{children}</NavigationWrapper>
      </body>
    </html>
  );
}
