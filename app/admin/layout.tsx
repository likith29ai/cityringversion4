"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AdminGuard from "./AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Login page — no chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      router.replace("/admin/login");
    }
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/approvals", label: "Membership" },
    { href: "/admin/join-requests", label: "Join requests" },
    { href: "/admin/groups/new", label: "New group" },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                CR
              </div>
              <div>
                <div className="font-semibold leading-tight">CityRing Admin</div>
                <div className="text-xs text-zinc-500">Admin Panel</div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-sm border hover:bg-zinc-50 transition ${
                      active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={signOut}
                className="px-3 py-2 rounded-xl text-sm border bg-white border-zinc-200 hover:bg-zinc-50 transition"
              >
                Sign out
              </button>
            </nav>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
      </div>
    </AdminGuard>
  );
}