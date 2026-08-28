"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export function useAuthUser() {
  const [authState] = useState(() => {
    try {
      return { auth: getFirebaseAuth(), error: null as string | null };
    } catch (error) {
      return {
        auth: null,
        error: error instanceof Error ? error.message : "Failed to initialize auth.",
      };
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(authState.auth));

  useEffect(() => {
    if (!authState.auth) return;
    const unsubscribe = onAuthStateChanged(authState.auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [authState.auth]);

  return { user, loading, error: authState.error };
}
