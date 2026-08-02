"use client";
import { useRef, useState } from "react";
import { API_URL } from "@/lib/api";
export function SecureAudio({ sessionId, audioId }: { sessionId: string; audioId: string }) {
  const audio = useRef<HTMLAudioElement>(null); const furthest = useRef(0); const [completed, setCompleted] = useState(false);
  return <div className="secure-audio"><div className="instrument-mini">LISTENING · ONE PLAY</div><audio ref={audio} controls controlsList="nodownload noplaybackrate" preload="metadata" src={`${API_URL}/media/sessions/${sessionId}/audio/${audioId}`} onTimeUpdate={(event) => { furthest.current = Math.max(furthest.current, event.currentTarget.currentTime); }} onSeeking={(event) => { if (event.currentTarget.currentTime < furthest.current - .5) event.currentTarget.currentTime = furthest.current; }} onEnded={() => setCompleted(true)} onPlay={(event) => { if (completed) { event.currentTarget.pause(); event.currentTarget.currentTime = event.currentTarget.duration; } }}/><p>{completed ? "Audio completed. Replay is disabled for this section." : "Rewinding and replay are disabled."}</p></div>;
}
