import { CheckCircle2, Circle, ExternalLink, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { getSetupChecklist } from "@/lib/data";

export const metadata = { title: "Setup" };

export default function SetupPage() {
  const checklist = getSetupChecklist();
  const configured = checklist.filter((item) => item.configured).length;
  return (
    <>
      <PageHeader eyebrow="Setup & credentials" title="Connect deliberately." description="This surface reports whether a capability has the required configuration. Secret values are never read back into the browser." />
      <div className="setup-progress panel">
        <div><span>{configured}</span><strong>of {checklist.length} systems configured</strong><p>Demo mode remains useful while external connections are absent.</p></div>
        <div className="progress-track" aria-label={`${Math.round((configured / checklist.length) * 100)}% setup complete`}><span style={{ width: `${(configured / checklist.length) * 100}%` }} /></div>
      </div>
      <Panel title="Connection checklist" description="Environment presence only—never secret contents.">
        <div className="setup-list">
          {checklist.map((item, index) => (
            <article key={item.label} className="setup-row">
              <span className={item.configured ? "setup-number is-complete" : "setup-number"}>{item.configured ? <CheckCircle2 size={17} /> : String(index + 1).padStart(2, "0")}</span>
              <div><div><h3>{item.label}</h3>{item.configured ? <span className="configured-label"><Circle size={7} fill="currentColor" /> Configured</span> : <span className="missing-label"><Circle size={7} /> Not configured</span>}</div><p>{item.description}</p><small>Required for: {item.requiredFor}</small></div>
            </article>
          ))}
        </div>
      </Panel>
      <div className="setup-guidance-grid">
        <Panel title="Secret handling" description="Production baseline">
          <ul className="check-list"><li><LockKeyhole size={15} />Keep provider secrets in environment or a managed vault.</li><li><KeyRound size={15} />Encrypt persisted OAuth refresh tokens before database storage.</li><li><ShieldCheck size={15} />Rotate credentials after exposure, offboarding, or suspicious activity.</li></ul>
        </Panel>
        <Panel title="Start locally" description="Safe path to the first review">
          <ol className="number-list"><li><span>1</span>Copy the example environment and keep DEMO_MODE enabled.</li><li><span>2</span>Run discovery, migrations, seed, and the September importer.</li><li><span>3</span>Review W3-P5 before testing any month-level approval.</li></ol>
          <a className="text-link" href="/api/health" target="_blank">Open health endpoint <ExternalLink size={14} /></a>
        </Panel>
      </div>
    </>
  );
}
