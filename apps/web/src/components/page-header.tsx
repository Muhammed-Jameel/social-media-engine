import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions, contentLang, contentDir }: { eyebrow: string; title: string; description: string; actions?: ReactNode; contentLang?: string; contentDir?: "ltr" | "rtl" }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 lang={contentLang} dir={contentDir}>{title}</h1>
        <p className="page-description" lang={contentLang} dir={contentDir}>{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
