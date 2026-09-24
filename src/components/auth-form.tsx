"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const result = signup
      ? await supabase.auth.signUp({ email, password, options:{ data:{display_name:name} } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) setError(result.error.message);
    else if (signup && !result.data.session) {
      setError("Account created. Sign in after completing the configured account setup.");
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
    setBusy(false);
  }

  return <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
    <div className="mb-8"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white font-bold">S</div><h1 className="text-2xl font-semibold">{signup ? "Create your account" : "Welcome back"}</h1><p className="mt-2 text-sm text-slate-500">Full Shyraq access. No premium feature tiers.</p></div>
    <form onSubmit={submit} className="space-y-4">
      {signup && <input required placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />}
      <input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />
      <input required minLength={6} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />
      {error && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{error}</p>}
      <button disabled={busy} className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait..." : signup ? "Create account" : "Sign in"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">{signup ? "Already have an account? " : "New to Shyraq? "}<Link href={signup?"/login":"/signup"} className="font-semibold text-slate-950">{signup?"Sign in":"Create one"}</Link></p>
  </div>;
}