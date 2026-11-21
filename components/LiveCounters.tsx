"use client";

import { useEffect, useRef, useState } from "react";
import type { Stats } from "@/lib/types";

const POLL_MS = 5000;

export function LiveCounters() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let stopped = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch("/api/stats", { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          setStats((await res.json()) as Stats);
          setOffline(false);
        } else setOffline(true);
      } catch {
        setOffline(true);
      }
      if (!stopped) t = setTimeout(tick, POLL_MS + Math.random() * 1000);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="mt-[5vh]">
      <div className="grid grid-cols-3 gap-[2vw]">
        <Counter label="people joined" value={stats?.people} emoji="🙋🏾" />
        <Counter label="matches made" value={stats?.matches} emoji="🤝🏾" />
        <Counter label="found in person" value={stats?.found} emoji="🎉" accent />
      </div>
      {offline && <p className="mt-4 text-xl text-muted">Reconnecting…</p>}
    </div>
  );
}

function Counter({ label, value, emoji, accent }: { label: string; value?: number; emoji: string; accent?: boolean }) {
  const shown = useCountUp(value ?? 0);
  const [bump, setBump] = useState(0);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== undefined && prev.current !== undefined && value > prev.current) setBump((b) => b + 1);
    prev.current = value;
  }, [value]);

  return (
    <div className={`rounded-[2rem] border border-line p-[1.8vw] ${accent ? "ring-grad" : "bg-surface"}`}>
      <div className="text-[clamp(1.8rem,3vw,3.5rem)]">{emoji}</div>
      <div
        key={bump}
        className={`${bump ? "pop" : ""} font-display text-[clamp(3.5rem,8vw,10rem)] font-extrabold leading-none tabular-nums ${accent ? "text-grad" : ""}`}
      >
        {value === undefined ? "–" : shown.toLocaleString()}
      </div>
      <div className="mt-2 text-[clamp(1rem,1.7vw,2rem)] font-semibold text-muted">{label}</div>
    </div>
  );
}

function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(a + (target - a) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}
