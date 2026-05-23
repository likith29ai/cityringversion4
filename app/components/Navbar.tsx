"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Menu, X } from "lucide-react";

type ProfileInfo = { name: string; email: string } | null;

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileInfo>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Hide on all admin pages ──────────────────────────────
  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    // On reset-password page: sign out immediately and never show user as logged in
    if (pathname?.startsWith("/reset-password")) {
      supabase.auth.signOut();
      setProfile(null);
      setLoading(false);
      return;
    }

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("email", session.user.email!)
          .maybeSingle();
        setProfile(data ? { name: data.name, email: data.email } : { name: session.user.email!.split("@")[0], email: session.user.email! });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Never set profile on reset-password page regardless of auth events
      if (pathname?.startsWith("/reset-password")) {
        setProfile(null);
        return;
      }
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("email", session.user.email!)
          .maybeSingle();
        setProfile(data ? { name: data.name, email: data.email } : { name: session.user.email!.split("@")[0], email: session.user.email! });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Join', href: '/join' },
    { label: 'Register', href: '/register' },
    { label: 'Exclusive', href: '/exclusive' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Complaint', href: '/complaint' },
  ];

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="border-y border-white/10 bg-black/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="h-14 sm:h-16 md:h-[60px] flex items-center justify-between gap-2 sm:gap-4">

            {/* Left: Profile */}
            <div className="flex items-center flex-shrink-0">
              {loading ? (
                <div className="h-8 w-20 rounded-xl bg-white/5 animate-pulse" />
              ) : profile ? (
                /* ── SIGNED IN ── */
                <div className="flex items-center gap-2">
                  {/* Profile dropdown */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-2 sm:px-3 py-1.5 hover:bg-white/10 transition"
                    >
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {getInitials(profile.name)}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-white/90 max-w-[80px] sm:max-w-[100px] truncate hidden xs:inline">
                        {profile.name}
                      </span>
                      <svg className={`h-3 w-3 text-white/40 transition-transform hidden sm:block ${menuOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute left-0 top-full mt-2 w-48 sm:w-52 rounded-xl sm:rounded-2xl border border-white/10 bg-[#0f0f12] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(profile.name)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs sm:text-sm font-medium text-white truncate">{profile.name}</p>
                              <p className="text-xs text-white/40 truncate">{profile.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1">
                          <a href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white/70 hover:text-white hover:bg-white/5 transition">
                            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                            </svg>
                            <span className="hidden sm:inline">My Dashboard</span>
                            <span className="sm:hidden">Dashboard</span>
                          </a>
                          <button onClick={handleSignOut} className="w-full flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
                            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="hidden sm:inline">Sign out</span>
                            <span className="sm:hidden">Exit</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sign out shortcut beside profile */}
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition"
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              ) : (
                /* ── SIGNED OUT ── */
                <a
                  href="/login"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M2 13c0-3 2.686-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Sign in
                </a>
              )}
            </div>

            {/* Center: Links - Desktop Only */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-3 xl:gap-6 text-xs sm:text-sm lg:text-[15px] tracking-wide text-white/80">
              {navLinks.slice(0, 5).map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  className="hover:text-white transition whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
              <a className="hover:text-white transition hidden xl:inline whitespace-nowrap" href="/contact">Contact</a>
              <a className="hover:text-white transition hidden 2xl:inline whitespace-nowrap" href="/complaint">Complaint</a>
            </div>

            {/* Right: Mobile Menu Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="text-white/70" />
                ) : (
                  <Menu size={20} className="text-white/70" />
                )}
              </button>
              
              {/* Desktop Spacer */}
              <div className="hidden lg:block min-w-[160px]" />
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-black/80 backdrop-blur animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-xs sm:text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur z-40">
        <div className="flex items-center justify-between">
          {navLinks.slice(0, 4).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center justify-center py-3 px-1 text-xs text-white/60 hover:text-white/90 transition"
            >
              <span className="text-center line-clamp-1">{link.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile padding */}
      <style jsx>{`
        @media (max-width: 1024px) {
          body {
            padding-bottom: 3.5rem;
          }
        }
      `}</style>
    </>
  );
}