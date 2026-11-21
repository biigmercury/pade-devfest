"use client";

import type { MatchView, PublicPerson } from "./types";

export type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; error: string; status: number; data?: Record<string, unknown> };

/** fetch with a timeout and friendly errors. Network failures on bad wifi are expected. */
export async function api<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<ApiResult<T>> {
  const { timeoutMs = 15000, ...rest } = init;
  try {
    const res = await fetch(path, {
      ...rest,
      headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* empty or non-JSON body */
    }
    if (!res.ok) {
      const d = (data || {}) as Record<string, unknown>;
      return { ok: false, status: res.status, error: (d.error as string) || "Something went wrong. Try again.", data: d };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (e) {
    const timeout = e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
    return {
      ok: false,
      status: 0,
      error: timeout ? "The wifi is slow. Hang tight and try again." : "No connection. Check your wifi and try again.",
    };
  }
}

const ME_KEY = "pade:me";
const CURRENT_KEY = "pade:current";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode or storage full: the app still works for this session */
  }
}

export const store = {
  me: () => read<PublicPerson>(ME_KEY),
  setMe: (p: PublicPerson | null) => write(ME_KEY, p),
  current: () => read<MatchView>(CURRENT_KEY),
  setCurrent: (m: MatchView | null) => write(CURRENT_KEY, m),
  clear: () => {
    write(ME_KEY, null);
    write(CURRENT_KEY, null);
  },
};
