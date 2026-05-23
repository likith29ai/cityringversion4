"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07070A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Verifying authentication…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}