"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "likith200305@gmail.com";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          setChecking(false);
        } else {
          setIsAdmin(false);
          setChecking(false);
          router.replace("/admin/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAdmin(false);
        setChecking(false);
        router.replace("/admin/login");
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          if (pathname !== "/admin/login") {
            router.replace("/admin/login");
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  if (checking && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-[#07070A] text-white flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Checking admin access…</div>
      </div>
    );
  }

  if (!isAdmin && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-[#07070A] text-white flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Redirecting…</div>
      </div>
    );
  }

  return <>{children}</>;
}