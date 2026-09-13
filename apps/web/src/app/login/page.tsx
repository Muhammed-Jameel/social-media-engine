import Image from "next/image";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata = { title: "Owner sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (isDemoMode()) redirect("/");
  const { error } = await searchParams;
  return (
    <main id="main-content" className="login-shell">
      <section className="login-brand-panel">
        <Image src="/brand/aurendor-horizontal-pale.svg" alt="AURENDOR" width={415} height={86} style={{ height: "auto" }} priority />
        <div className="login-statement">
          <p className="eyebrow eyebrow-pale">Owner control plane</p>
          <h1>Digital Civilization,<br />operated deliberately.</h1>
          <p>One protected surface for strategy, creative standards, explicit approvals, and provider-safe execution.</p>
        </div>
        <div className="login-proof"><ShieldCheck size={18} /><span>Signed 12-hour sessions · HttpOnly · SameSite strict</span></div>
      </section>
      <section className="login-form-panel">
        <form className="login-form" action={loginAction}>
          <span className="login-icon"><LockKeyhole size={23} /></span>
          <p className="eyebrow">Private workspace</p>
          <h2>Sign in as owner</h2>
          <p className="form-intro">Publishing controls and approvals are restricted to the configured AURENDOR owner.</p>
          {error ? <div className="form-error" role="alert">The email or password did not match the configured owner.</div> : null}
          <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button button-primary button-wide" type="submit"><KeyRound size={17} /> Enter Content OS</button>
          <p className="form-footnote">Credentials are configured locally and are never displayed in the console.</p>
        </form>
      </section>
    </main>
  );
}
