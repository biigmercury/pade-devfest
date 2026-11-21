"use client";

import { useState } from "react";
import { EMOJIS, FUN_PICKS, FUN_QUESTION, GOALS, INTERESTS } from "@/lib/constants";
import { api } from "@/lib/client";
import type { PublicPerson } from "@/lib/types";
import { Wordmark } from "./Logo";

type Props = { onDone: (p: PublicPerson) => void };

export function Onboarding({ onDone }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [fun, setFun] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const steps = [name.trim().length > 0, !!emoji, interests.length === 3, !!goal, !!fun];
  const done = steps.filter(Boolean).length;
  const ready = done === steps.length;

  function toggleInterest(id: string) {
    setInterests((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? [...cur.slice(1), id] : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    const res = await api<{ profile: PublicPerson }>("/api/profile", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), emoji, interests, goal, fun_pick: fun }),
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone(res.data.profile);
  }

  const hint = !steps[0] ? "Add your name" : !steps[1] ? "Pick an emoji" : !steps[2] ? `Pick ${3 - interests.length} more interest${3 - interests.length === 1 ? "" : "s"}` : !steps[3] ? "Choose a goal" : !steps[4] ? "Party or smoky?" : "";

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-36 pt-8">
      <header className="rise">
        <Wordmark size={30} />
        <h1 className="mt-8 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight">
          Meet someone <span className="text-grad">worth meeting.</span>
        </h1>
        <p className="mt-3 text-[1.05rem] text-muted">Five quick taps. We match you with someone in the room and hand you the opening line.</p>
      </header>

      <Section n={1} title="What should we call you?" style={{ animationDelay: "60ms" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="given-name"
          enterKeyHint="next"
          placeholder="First name"
          aria-label="Your first name"
          className="w-full rounded-2xl border border-line bg-surface-2 px-5 py-4 text-xl font-semibold outline-none transition placeholder:text-muted/60 focus:border-pink/60 focus:ring-4 focus:ring-pink/15"
        />
        <div className="mt-4 grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Pick an emoji">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              role="radio"
              aria-checked={emoji === e}
              onClick={() => setEmoji(e)}
              className={`aspect-square rounded-xl text-2xl transition active:scale-90 ${emoji === e ? "bg-grad scale-105 shadow-lg shadow-pink/30" : "bg-surface-2 hover:bg-white/10"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </Section>

      <Section n={2} title="Pick 3 things you're into" aside={`${interests.length}/3`} style={{ animationDelay: "120ms" }}>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = interests.includes(i.id);
            return (
              <button
                type="button"
                key={i.id}
                aria-pressed={on}
                onClick={() => toggleInterest(i.id)}
                className={`rounded-full px-4 py-2.5 text-[0.95rem] font-semibold transition active:scale-95 ${on ? "bg-grad text-white shadow-md shadow-pink/25" : "border border-line bg-surface-2 text-text/90 hover:bg-white/10"}`}
              >
                <span className="mr-1.5">{i.emoji}</span>
                {i.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section n={3} title="What are you here for?" style={{ animationDelay: "180ms" }}>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              type="button"
              key={g.id}
              aria-pressed={goal === g.id}
              onClick={() => setGoal(g.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3.5 text-left text-[0.95rem] font-semibold transition active:scale-95 ${goal === g.id ? "ring-grad bg-surface" : "border border-line bg-surface-2 hover:bg-white/10"} ${g.id === "vibes" ? "col-span-2" : ""}`}
            >
              <span className="text-xl">{g.emoji}</span>
              {g.label}
            </button>
          ))}
        </div>
      </Section>

      <Section n={4} title={FUN_QUESTION} style={{ animationDelay: "240ms" }}>
        <div className="grid grid-cols-2 gap-3">
          {FUN_PICKS.map((f) => (
            <button
              type="button"
              key={f.id}
              aria-pressed={fun === f.id}
              onClick={() => setFun(f.id)}
              className={`flex flex-col items-center gap-1 rounded-3xl px-4 py-6 font-display text-lg font-bold transition active:scale-95 ${fun === f.id ? "bg-grad shadow-lg shadow-pink/30" : "border border-line bg-surface-2 hover:bg-white/10"}`}
            >
              <span className={`text-4xl ${fun === f.id ? "pop" : ""}`}>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/85 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md">
          {error && (
            <p role="alert" className="mb-2 rounded-xl bg-pink/15 px-4 py-2 text-sm font-medium text-pink">
              {error}
            </p>
          )}
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="bg-grad h-full rounded-full transition-all duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <button
            type="submit"
            disabled={!ready || busy}
            className="bg-grad w-full rounded-full py-4 font-display text-xl font-extrabold text-white shadow-xl shadow-pink/25 transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {busy ? "Finding your person…" : ready ? "Pàdé me →" : hint}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({
  n,
  title,
  aside,
  children,
  style,
}: {
  n: number;
  title: string;
  aside?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section className="rise mt-9" style={style}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">
          <span className="mr-2 text-muted">{n}.</span>
          {title}
        </h2>
        {aside && <span className="text-sm font-semibold text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
