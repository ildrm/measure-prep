"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(Object.fromEntries(form)) }); router.push("/dashboard"); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in failed."); setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}><div className="eyebrow">{mode === "login" ? "RETURN TO YOUR WORKSPACE" : "SET UP YOUR WORKSPACE"}</div><h1>{mode === "login" ? "Sign in" : "Create account"}</h1>{mode === "register" && <label>Full name<input name="name" autoComplete="name" minLength={2} required /></label>}<label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>{error && <div className="error" role="alert">{error}</div>}<button className="button primary" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button><p>{mode === "login" ? <>New here? <Link href="/register">Create an account</Link> · <Link href="/forgot-password">Reset password</Link></> : <>Already registered? <Link href="/login">Sign in</Link></>}</p>{mode === "login" && <aside className="demo-note"><b>Demo access</b><code>student@exam.local</code><code>Practice123!</code></aside>}</form>;
}
