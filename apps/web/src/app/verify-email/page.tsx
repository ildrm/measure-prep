import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/account-token-form";
export default function VerifyEmailPage(){return <div className="auth-shell"><div className="auth-context"><span className="instrument-mini">VERIFY · 24 HR</span><h2>Confirm the address used for account recovery and notifications.</h2></div><Suspense><VerifyEmailForm/></Suspense></div>}
