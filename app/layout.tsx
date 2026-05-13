import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustGuard AI | Behavioral Authentication for Digital Banking",
  description: "Hackathon MVP for explainable, AI-driven behavioral authentication across digital banking channels."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen page-gradient">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow"><ShieldCheck className="h-5 w-5" /></span>
                <span>TrustGuard AI</span>
              </Link>
              <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
                <Link href="/login" className="hover:text-foreground">Demo Login</Link>
                <Link href="/banking" className="hover:text-foreground">Banking</Link>
                <Link href="/transfer" className="hover:text-foreground">Transfer</Link>
                <Link href="/admin" className="hover:text-foreground">Analyst Dashboard</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
