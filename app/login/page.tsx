'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => { if (user) router.replace('/'); }), [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Something went wrong.');
    } finally { setBusy(false); }
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="brand"><span className="brandMark">H</span><span>holiwork</span></div>
        <span className="pill">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span>
        <h1>{mode === 'login' ? 'Your day, in one place.' : 'Build your workspace.'}</h1>
        <p>Tasks, studies, money and focus — calmly organized.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
          {error && <div className="authError">{error}</div>}
          <button className="primary authSubmit" disabled={busy}>{busy ? 'Loading…' : mode === 'login' ? 'Log in →' : 'Create account →'}</button>
        </form>
        <button className="switchAuth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
}
