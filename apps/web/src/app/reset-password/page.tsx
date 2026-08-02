import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account-token-form";
export default function ResetPasswordPage(){return <div className="auth-shell"><div className="auth-context"><span className="instrument-mini">RESET · 30 MIN</span><h2>Reset links are single-use and expire after thirty minutes.</h2></div><Suspense><ResetPasswordForm/></Suspense></div>}
