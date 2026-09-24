"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CheckIcon } from "@/components/icons";

const answers = [
  { label: "Again", interval: "< 1 min" },
  { label: "Hard", interval: "6 min" },
  { label: "Good", interval: "10 min" },
  { label: "Easy", interval: "4 days" },
];

export default function ReviewPage() {
  const [revealed, setRevealed] = useState(false);
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col px-5 py-7 sm:px-8">
        <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-medium text-slate-400">English B2</p><p className="mt-1 text-sm text-slate-500">1 of 42 due today</p></div><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-[18%] rounded-full bg-slate-950" /></div></div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="min-h-[390px] rounded-3xl border border-black/[0.06] bg-white p-8 shadow-sm sm:p-12">
            <div className="flex h-full min-h-[326px] flex-col items-center justify-center text-center">
              <span className="mb-8 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Vocabulary</span>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">to figure something out</h1>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} className="mt-12 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold transition hover:border-slate-300 hover:bg-slate-50">Show answer</button>
              ) : (
                <div className="mt-10 max-w-xl"><div className="mb-5 h-px bg-slate-100" /><p className="text-lg leading-8 text-slate-600">to understand or solve something after thinking about it</p><p className="mt-4 text-sm text-slate-400">Example: I finally figured out how the problem worked.</p></div>
              )}
            </div>
          </div>
          {revealed && <div className="mt-5 grid grid-cols-4 gap-2">{answers.map((answer) => <button key={answer.label} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition hover:border-slate-300 hover:bg-slate-50"><p className="text-sm font-semibold">{answer.label}</p><p className="mt-1 text-[11px] text-slate-400">{answer.interval}</p></button>)}</div>}
          {!revealed && <p className="mt-5 text-center text-xs text-slate-400">Press Space to reveal</p>}
          {revealed && <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400"><CheckIcon size={14} />Review event will be recorded locally</div>}
        </div>
      </div>
    </AppShell>
  );
}