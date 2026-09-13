import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import type { ContentSummaryView } from "@social-media-plugin/db/runtime";
import { formatDateTime, humanize } from "@/lib/format";
import { RiskBadge, StatusBadge } from "./status-badge";

export function ContentCard({ item, compact = false, eager = false }: { item: ContentSummaryView; compact?: boolean; eager?: boolean }) {
  const isVideo = item.thumbnailUrl ? /\.(mp4|mov|webm)(?:\?|$)/i.test(item.thumbnailUrl) : false;
  return (
    <article className={compact ? "content-card is-compact" : "content-card"}>
      <Link href={`/content/${item.id}`} className="content-media" aria-label={`Review ${item.title}`}>
        {item.thumbnailUrl && isVideo ? (
          <video src={item.thumbnailUrl} muted playsInline preload="metadata" aria-label={`Video creative preview for ${item.title}`} />
        ) : item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt={`Creative preview for ${item.title}`} fill loading={eager ? "eager" : "lazy"} sizes={compact ? "96px" : "(max-width: 680px) 100vw, 280px"} />
        ) : (
          <div className="media-placeholder"><Layers3 aria-hidden="true" size={25} /><span>Preview pending</span></div>
        )}
        <span className="content-key">{item.externalKey}</span>
      </Link>
      <div className="content-card-body">
        <div className="content-card-badges">
          {item.supersededAt ? <StatusBadge value="SUPERSEDED" label="Historical" /> : null}
          <StatusBadge value={item.status} />
          {(item.riskLevel === "high" || item.riskLevel === "critical") ? <RiskBadge value={item.riskLevel} /> : null}
        </div>
        <div>
          <p className="meta-line">{formatDateTime(item.scheduledAt)} · {humanize(item.format)}</p>
          <h3><Link href={`/content/${item.id}`}>{item.title}</Link></h3>
        </div>
        <div className="platform-row" aria-label="Target platforms">
          {item.platforms.map((platform) => <span key={platform}>{humanize(platform)}</span>)}
        </div>
        {item.supersededAt ? <p className="qa-note">Read-only history · {item.supersededReason ?? "Replaced by the current plan"}</p> : item.qaFlags.length ? <p className="qa-note">{item.qaFlags.length} QA signal{item.qaFlags.length === 1 ? "" : "s"} require review</p> : null}
        <Link className="text-link" href={`/content/${item.id}`}>Open review <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </div>
    </article>
  );
}
