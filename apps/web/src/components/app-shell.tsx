import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Bell, LogOut, Pause, Radio, ShieldAlert } from "lucide-react";
import type { EngineSettingsView } from "@social-media-plugin/db/runtime";
import type { OwnerSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import { NavLinks } from "./nav-links";

export function AppShell({ session, settings, notificationCount, children }: { session: OwnerSession; settings: EngineSettingsView; notificationCount: number; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="SOCIAL_MEDIA_PLUGIN Content OS home">
          <Image src="/brand/social-horizontal-pale.svg" alt="SOCIAL_MEDIA_PLUGIN" width={415} height={86} style={{ height: "auto" }} priority />
          <span>Content OS</span>
        </Link>
        <div className="environment-card">
          <div className="environment-label"><Radio aria-hidden="true" size={14} /> Environment</div>
          <strong>{settings.dryRun ? "Dry run" : "Production"}</strong>
          <span>{settings.autonomyStage}</span>
        </div>
        <NavLinks />
        <div className="sidebar-footer">
          <div className="owner-chip">
            <span className="owner-avatar" aria-hidden="true">MJ</span>
            <span><strong>Owner</strong><small>{session.email}</small></span>
          </div>
          {!session.demo ? (
            <form action={logoutAction}>
              <button type="submit" className="icon-button icon-button-dark" aria-label="Sign out"><LogOut size={17} /></button>
            </form>
          ) : null}
        </div>
      </aside>

      <div className="main-frame">
        <header className="mobile-header">
          <Link href="/" aria-label="SOCIAL_MEDIA_PLUGIN Content OS home">
            <Image src="/brand/social-horizontal-pale.svg" alt="SOCIAL_MEDIA_PLUGIN" width={415} height={86} style={{ height: "auto" }} priority />
          </Link>
          <div className="mobile-status"><span className="pulse" />{settings.dryRun ? "Dry run" : "Live"}</div>
        </header>
        <div className="mobile-nav"><NavLinks /></div>
        {session.demo ? (
          <div className="demo-banner" role="status">
            <AlertTriangle aria-hidden="true" size={16} />
            <span><strong>Demonstration environment.</strong> Legacy controls are in demonstration mode. The Analytics page separately identifies real Postiz observations.</span>
          </div>
        ) : null}
        {settings.creativeProductionPaused ? (
          <div className="creative-pause-banner" role="alert" aria-label="Creative production release gate">
            <ShieldAlert aria-hidden="true" size={18} />
            <span>
              <strong>Creative production frozen.</strong> POST_PRODUCTION claims are blocked; planning and analytics remain available.
              <small>Read-only release gate · {settings.creativeGateState.replaceAll("_", " ")}</small>
            </span>
            <Link href="/controls">View gate</Link>
          </div>
        ) : null}
        {settings.paused ? (
          <div className="pause-banner" role="alert">
            <Pause aria-hidden="true" size={16} fill="currentColor" />
            <span><strong>Engine paused.</strong> Generation, scheduling, and publishing workers are held.</span>
            <Link href="/controls">Review control</Link>
          </div>
        ) : null}
        <div className="top-rail">
          <div><span className="pulse" /> System ready <span className="rail-divider" /> Asia/Baghdad</div>
          <Link href="/#notifications" className="notification-link" aria-label={`${notificationCount} notifications`}>
            <Bell size={17} />
            {notificationCount > 0 ? <span>{notificationCount}</span> : null}
          </Link>
        </div>
        <main id="main-content" className="main-content">{children}</main>
      </div>
    </div>
  );
}
