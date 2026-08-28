"use client";

import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [loading, router, user]);

  return <p className="status">Loading Holiwork…</p>;
}
