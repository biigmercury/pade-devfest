"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { goalLabel, interestEmoji, interestLabel, funLabel } from "@/lib/constants";
import { api, store } from "@/lib/client";
import type { MatchView, PublicPerson } from "@/lib/types";
import { Mark } from "./Logo";

type Props = { me: PublicPerson; onReset: () => void; autoMatch: boolean };
type Lists = { met: MatchView[]; incoming: MatchView[] };

const POLL_BASE_MS = 10_000;
const POLL_JITTER_MS = 4_000;

export function MatchScreen({ me, onReset, autoMatch }: Props) {
  const [current, setCurrent] = useState<MatchView | null>(() => store.current());
  const [lists, setLists] = useState<Lists | null>(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [everyone, setEveryone] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const started = useRef(false);

  const refreshLists = useCallback(async () => {
    const res = await api<Lists>(`/api/matches?profileId=${me.id}`, { timeoutMs: 10000 });
    if (res.ok) setLists(res.data);
    else if (res.status === 404) onReset();
  }, [me.id, onReset]);

  const match = useCallback(async () => {
    setMatching(true);
    setError("");
    const res = await api<{ match: MatchView | null; reason?: string }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ profileId: me.id }),
      timeoutMs: 20000,
    });
    setMatching(false);
    if (!res.ok) {
      if (res.status === 404) return onReset();
      if (res.status === 429) {
        const ms = Number(res.data?.retryAfterMs) || 3000;
        setCooldown(Math.ceil(ms / 1000));
        return;
      }
      setError(res.error);
      return;
    }
    if (!res.data.match) {
      setEveryone(true);
      return;
    }
    setEveryone(false);
    setCurrent(res.data.match);
    store.setCurrent(res.data.match);
    setLists((l) => (l ? { ...l, met: [res.data.match!, ...l.met.filter((m) => m.id !== res.data.match!.id)] } : l));
    setCooldown(3);
  }, [me.id, onReset]);

  // First load: get a match right away if we don't have one, and load the lists.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kick off the first match on mount
    if (autoMatch || !store.current()) void match();
    void refreshLists();
  }, [autoMatch, match, refreshLists]);

  // Cooldown ticker for "Match again".
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Gentle polling with jitter, only while the tab is visible.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let stopped = false;
    const loop = () => {
      t = setTimeout(async () => {
        if (!stopped && document.visibilityState === "visible") await refreshLists();
        if (!stopped) loop();
      }, POLL_BASE_MS + Math.random() * POLL_JITTER_MS);
    };
    loop();
    const onVis = () => document.visibilityState === "visible" && void refreshLists();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshLists]);

  async function markFound(m: MatchView) {
    // Optimistic: flip it now, roll back if the server says no.
    const flip = (found: boolean) => {
      const upd = (x: MatchView) => (x.id === m.id ? { ...x, found } : x);
      setCurrent((c) => {
        const next = c && c.id === m.id ? { ...c, found } : c;
        if (next) store.setCurrent(next);
        return next;
      });
      setLists((l) => (l ? { met: l.met.map(upd), incoming: l.incoming.map(upd) } : l));
    };
    flip(true);
    setCelebrate((n) => n + 1);
    const res = await api("/api/found", { method: "POST", body: JSON.stringify({ profileId: me.id, matchId: m.id }) });
    if (!res.ok) {
      flip(false);
      setError(res.error);
    }
  }

  const metOthers = (lists?.met ?? []).filter((m) => m.id !== current?.id);
  const incoming = (lists?.incoming ?? []).filter((m) => m.person.id !== current?.person.id);
  const metCount = lists ? lists.met.filter((m) => m.found).length + lists.incoming.filter((m) => m.found).length : 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-16 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mark size={28} />
          <span className="font-display text-xl font-extrabold">Pàdé</span>
        </div>
        <button
          onClick={() => {
            if (confirm("Start over with a new profile?")) onReset();
          }}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold"
          aria-label="Your profile. Tap to start over."
        >
          <span className="text-lg">{me.emoji}</span>
          <span className="max-w-[8rem] truncate">{me.name}</span>
        </button>
      </header>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        {matching && !current ? "Finding your person" : "Your match"}
      </p>

      {matching && !current ? (
        <MatchSkeleton />
      ) : everyone && !current ? (
        <EmptyCard onRetry={match} />
      ) : current ? (
        <MatchCard key={current.id} m={current} dim={matching} onFound={() => markFound(current)} celebrate={celebrate} />
      ) : (
        <EmptyCard onRetry={match} />
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-pink/15 px-4 py-3 text-sm font-medium text-pink">
          <span>{error}</span>
          <button onClick={() => (current ? setError("") : match())} className="shrink-0 rounded-full bg-pink px-3 py-1 font-bold text-white">
            {current ? "OK" : "Retry"}
          </button>
        </div>
      )}

      {everyone && current && (
        <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
          You&apos;ve matched with everyone here for now 🙌 Give it a minute while more people join.
        </p>
      )}

      <button
        onClick={match}
        disabled={matching || cooldown > 0}
        className="mt-4 w-full rounded-full border border-line bg-surface py-4 font-display text-lg font-bold transition active:scale-[0.98] disabled:opacity-50"
      >
        {matching ? "Matching…" : cooldown > 0 ? `Match again in ${cooldown}s` : "🔀 Match again"}
      </button>

      {incoming.length > 0 && (
        <section className="mt-10 rise">
          <h2 className="font-display text-xl font-bold">👀 Looking for you</h2>
          <p className="mt-1 text-sm text-muted">These people got matched with you. Find them!</p>
          <ul className="mt-3 space-y-2">
            {incoming.map((m) => (
              <PersonRow key={m.id} m={m} onFound={() => markFound(m)} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">People you&apos;ve met</h2>
          {lists && <span className="text-sm font-semibold text-muted">{metCount} found</span>}
        </div>
        {!lists ? (
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        ) : metOthers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
            Your matches will pile up here. Go find {current ? current.person.name.split(" ")[0] : "your person"}!
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {metOthers.map((m) => (
              <PersonRow key={m.id} m={m} onFound={() => markFound(m)} />
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-12 text-center text-xs text-muted">Pàdé · DevFest Ibadan · be kind, say hi 👋</footer>
    </main>
  );
}

function MatchCard({ m, onFound, celebrate, dim }: { m: MatchView; onFound: () => void; celebrate: number; dim: boolean }) {
  const first = m.person.name.split(" ")[0];
  return (
    <article className={`rise relative mt-3 overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-2xl shadow-black/40 transition ${dim ? "opacity-60" : ""}`}>
      <div className="bg-grad pointer-events-none absolute inset-x-0 top-0 h-28 opacity-25 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="ring-grad floaty grid h-20 w-20 shrink-0 place-items-center rounded-full text-5xl">{m.person.emoji}</div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 break-words font-display text-[1.85rem] font-extrabold leading-[1.05]">{m.person.name}</h3>
          <p className="text-[0.95rem] font-medium text-muted">
            {goalLabel(m.person.goal)} · {funLabel(m.person.fun_pick)}
          </p>
          {m.person.is_demo && (
            <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-muted">
              Demo profile
            </span>
          )}
        </div>
      </div>

      <ul className="relative mt-5 flex flex-wrap gap-2">
        {m.person.interests.map((i) => {
          const shared = m.shared.includes(i);
          return (
            <li
              key={i}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${shared ? "bg-grad text-white" : "border border-line bg-surface-2 text-text/80"}`}
            >
              {interestEmoji(i)} {interestLabel(i)}
              {shared && " ✓"}
            </li>
          );
        })}
      </ul>

      <blockquote className="relative mt-5 rounded-3xl bg-surface-2 p-5 text-[1.1rem] font-medium leading-relaxed">
        <span className="text-grad absolute -top-3 left-4 font-display text-5xl leading-none">“</span>
        {m.icebreaker}
      </blockquote>

      <div className="relative">
        <button
          onClick={onFound}
          disabled={m.found}
          className={`mt-5 w-full rounded-full py-4 font-display text-xl font-extrabold text-white transition active:scale-[0.98] ${m.found ? "bg-green/90 shadow-lg shadow-green/25" : "bg-grad shadow-xl shadow-pink/30"}`}
        >
          {m.found ? `You found ${first}! 🎉` : "Found them! 🙌"}
        </button>
        {celebrate > 0 && m.found && <Burst key={celebrate} />}
      </div>
    </article>
  );
}

function PersonRow({ m, onFound }: { m: MatchView; onFound: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-2xl">{m.person.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{m.person.name}</p>
        <p className="truncate text-xs text-muted">{m.person.interests.map(interestLabel).join(" · ")}</p>
      </div>
      {m.found ? (
        <span className="rounded-full bg-green/15 px-3 py-1 text-sm font-bold text-green">Found ✓</span>
      ) : (
        <button onClick={onFound} className="rounded-full border border-line px-3 py-1 text-sm font-bold active:scale-95">
          Found?
        </button>
      )}
    </li>
  );
}

function MatchSkeleton() {
  return (
    <div className="mt-3 rounded-[2rem] border border-line bg-surface p-6" aria-busy="true" aria-label="Finding your match">
      <div className="flex items-center gap-4">
        <div className="skeleton h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="skeleton mt-5 h-24 rounded-3xl" />
      <p className="mt-4 text-center text-sm text-muted">Scanning the room for your kind of person…</p>
    </div>
  );
}

function EmptyCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-3 rounded-[2rem] border border-line bg-surface p-8 text-center">
      <div className="text-5xl">🫣</div>
      <p className="mt-3 font-display text-xl font-bold">No one to match yet</p>
      <p className="mt-1 text-sm text-muted">The room is still filling up. Try again in a moment.</p>
      <button onClick={onRetry} className="bg-grad mt-5 rounded-full px-6 py-3 font-bold text-white">
        Try again
      </button>
    </div>
  );
}

const BURST = ["🎉", "✨", "🙌", "🔥", "💜", "🥳", "⭐", "🎊"];
function Burst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 90 + (i % 3) * 30;
        return (
          <span
            key={i}
            className="absolute text-2xl"
            style={
              {
                animation: "burst 0.9s cubic-bezier(0.2,0.8,0.2,1) forwards",
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist - 40}px`,
                "--rot": `${(i % 2 ? 1 : -1) * 90}deg`,
              } as React.CSSProperties
            }
          >
            {BURST[i % BURST.length]}
          </span>
        );
      })}
    </div>
  );
}
