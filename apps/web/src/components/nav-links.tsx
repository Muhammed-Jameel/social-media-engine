"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpenCheck, CalendarRange, Gauge, Library, PlugZap, Send, Settings2, ShieldCheck, Workflow } from "lucide-react";

const links = [
  { href: "/", label: "Command", icon: Gauge },
  { href: "/plans/2026-09", label: "Plan", icon: CalendarRange },
  { href: "/content", label: "Content", icon: Library },
  { href: "/production", label: "Production", icon: Workflow },
  { href: "/publishing", label: "Publishing", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/runs", label: "Runs", icon: Workflow },
  { href: "/providers", label: "Providers", icon: PlugZap },
  { href: "/controls", label: "Controls", icon: ShieldCheck },
  { href: "/setup", label: "Setup", icon: Settings2 },
  { href: "/guide", label: "Guide", icon: BookOpenCheck },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "nav-link is-active" : "nav-link"} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
