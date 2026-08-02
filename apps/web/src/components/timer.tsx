"use client";
import { useEffect, useMemo, useRef, useState } from "react";
export function Timer({ endsAt, totalSeconds, onExpire }: { endsAt: string; totalSeconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000))); const called = useRef(false);
  useEffect(() => { called.current = false; const tick = () => { const next = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)); setRemaining(next); if (next === 0 && !called.current) { called.current = true; onExpire(); } }; tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [endsAt, onExpire]);
  const state = remaining <= 60 ? "urgent" : remaining <= totalSeconds * .25 ? "warn" : "calm";
  const value = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`, [remaining]);
  return <div className={`timer ${state}`} role="timer" aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`} aria-live={remaining <= 60 && remaining % 15 === 0 ? "polite" : "off"}><span>TIME LEFT</span><strong>{value}</strong></div>;
}
