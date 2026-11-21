"use client";

import { useCallback, useEffect, useState } from "react";
import { store } from "@/lib/client";
import type { PublicPerson } from "@/lib/types";
import { Onboarding } from "./Onboarding";
import { MatchScreen } from "./MatchScreen";
import { Mark } from "./Logo";

type State = { phase: "boot" } | { phase: "onboard" } | { phase: "match"; me: PublicPerson; fresh: boolean };

export function PadeApp() {
  const [state, setState] = useState<State>({ phase: "boot" });

  // Restore from localStorage so a refresh never loses the user.
  useEffect(() => {
    const me = store.me();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage after hydration
    setState(me ? { phase: "match", me, fresh: false } : { phase: "onboard" });
  }, []);

  const onDone = useCallback((p: PublicPerson) => {
    store.setMe(p);
    store.setCurrent(null);
    setState({ phase: "match", me: p, fresh: true });
    window.scrollTo({ top: 0 });
  }, []);

  const onReset = useCallback(() => {
    store.clear();
    setState({ phase: "onboard" });
    window.scrollTo({ top: 0 });
  }, []);

  if (state.phase === "boot") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Mark size={56} className="floaty" />
      </div>
    );
  }
  if (state.phase === "onboard") return <Onboarding onDone={onDone} />;
  return <MatchScreen key={state.me.id} me={state.me} onReset={onReset} autoMatch={state.fresh} />;
}
