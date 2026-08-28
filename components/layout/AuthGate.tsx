"use client";

import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [loading, pathname, router, user]);

  if (loading) return <p className="status">Checking your session…</p>;
  if (error) return <p className="status error">{error}</p>;
  if (!user) return <p className="status">Redirecting…</p>;

  return <>{children}</>;
}
