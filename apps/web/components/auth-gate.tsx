"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const AuthContext = createContext<Session | null>(null);

export function useAuthSession() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase environment variables are not configured.");
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else if (data.session) {
      setSession(data.session);
    } else {
      const { data: current } = await supabase.auth.getSession();
      setSession(current.session);
    }

    setSubmitting(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
  }

  if (loading) return <div className="auth-loading">Жүктелуде...</div>;

  if (!session) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={signIn}>
          <div className="brand">SHYRAQ</div>
          <p className="brand-subtitle">Productivity & learning OS</p>
          <h1>Кіру</h1>
          <p className="auth-description">Жеке тапсырмаларыңа қол жеткізу үшін аккаунтыңа кір.</p>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Құпиясөз<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
          {error ? <p role="alert" className="error-message">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Кіру..." : "Кіру"}</button>
        </form>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={session}>
      <div className="user-bar">
        <span>{session.user.email}</span>
        <button onClick={() => void signOut()}>Шығу</button>
      </div>
      {children}
    </AuthContext.Provider>
  );
}
