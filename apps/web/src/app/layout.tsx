import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Measure · Practice exams", template: "%s · Measure" }, description: "Timed, original IELTS, TOEFL, and GRE practice." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">M</span><span>MEASURE</span></Link><nav aria-label="Primary"><Link href="/dashboard">Dashboard</Link><Link href="/admin">Content studio</Link><Link href="/about">About</Link><Link className="nav-signin" href="/login">Sign in</Link></nav></header><main id="main">{children}</main><footer><div><strong>MEASURE</strong><p>Original practice, precise feedback.</p></div><p className="legal">Not affiliated with or endorsed by the British Council, IDP, Cambridge Assessment English, or ETS. IELTS, TOEFL, and GRE are trademarks of their respective owners.</p></footer></body></html>;
}
