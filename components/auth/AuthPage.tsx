"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      if (mode === "signup") {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credentials.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      router.replace(nextPath || "/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card form" onSubmit={onSubmit}>
        <h1>{mode === "signup" ? "Create your Holiwork account" : "Welcome back"}</h1>
        {mode === "signup" && (
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
        </label>

        {error && <p className="status error">{error}</p>}

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "signup" ? "Sign up" : "Login"}
        </button>

        {mode === "signup" ? (
          <p>
            Already have an account? <Link href="/login">Login</Link>
          </p>
        ) : (
          <p>
            Need an account? <Link href="/signup">Create one</Link>
          </p>
        )}
      </form>
    </div>
  );
}
