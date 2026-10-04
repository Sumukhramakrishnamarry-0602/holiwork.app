'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => onAuthStateChanged(auth, (user) => { if (user) router.replace('/'); }), [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      }
      router.replace('/');
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'That email and password do not match an account.',
        'auth/email-already-in-use': 'An account already exists with this email. Try logging in.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a password with at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please wait a bit and try again.',
        'auth/network-request-failed': 'Network issue. Check your connection and try again.',
      };
      setError(messages[code] || 'We could not complete that request. Please try again.');
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError('Enter your email above first, then choose “Forgot password?”.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice('If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      setError(code === 'auth/invalid-email' ? 'Enter a valid email address.' : 'Could not send a reset email right now. Please try again.');
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
          {mode === 'signup' && <label>Your name<input type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" /></label>}
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
          {error && <div className="authError" role="alert">{error}</div>}
          {notice && <div className="authNotice" role="status">{notice}</div>}
          <button className="primary authSubmit" disabled={busy}>{busy ? 'Loading…' : mode === 'login' ? 'Log in →' : 'Create account →'}</button>
        </form>
        {mode === 'login' && <button className="switchAuth" disabled={busy} onClick={() => void resetPassword()}>Forgot password?</button>}
        <button className="switchAuth" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
}
