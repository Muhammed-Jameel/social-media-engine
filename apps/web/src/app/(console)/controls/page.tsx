import { AlertOctagon, Check, CircleStop, Command, DatabaseZap, KeyRound, LockKeyhole, Pause, Play, ShieldCheck, Sparkles } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { classifyOwnerCommand } from "@aurendor/engine";
import { confirmOwnerCommandAction, interpretOwnerCommandAction, setEnginePauseAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";

export const metadata = { title: "Safety controls" };

export default async function ControlsPage({ searchParams }: { searchParams: Promise<{ preview?: string; result?: string; error?: string }> }) {
  const { preview, result, error } = await searchParams;
  const settings = await (await getRepository()).getSettings();
  const commandPreview = preview ? classifyOwnerCommand(preview) : null;
  return (
    <>
      <PageHeader eyebrow="Safety controls" title="Control is a system property." description="Global pause, dry-run posture, production enablement, and approval gates are explicit. No model or provider can infer permission from intent." actions={<StatusBadge value={settings.paused ? "PAUSED" : "AVAILABLE"} label={settings.paused ? "Engine paused" : "Engine active"} />} />
      {result ? <div className="result-banner" role="status"><Check size={17} /><div><strong>Owner command recorded.</strong><span>The durable audit trail and effective engine state now reflect this confirmed decision.</span></div></div> : null}

      <Panel title="Command the system in plain language" description="English or Arabic intent is classified into a bounded, inspectable change before it is persisted." className="command-panel">
        <form action={interpretOwnerCommandAction} className="command-form">
          <label className="field-label" htmlFor="owner-command">Owner command<textarea id="owner-command" name="command" maxLength={1000} required defaultValue={preview ?? ""} placeholder="Make the tone less promotional, or: أوقف النشر الآن" /></label>
          <div className="command-form-footer"><p><Command size={14} /> Emergency pause executes immediately. Resume and persistent preferences always require confirmation.</p><button className="button button-primary" type="submit"><Sparkles size={16} /> Interpret command</button></div>
        </form>
        {commandPreview ? (
          <div className="command-preview">
            <header><div><p className="eyebrow">Interpretation preview</p><h3>{commandPreview.classification.replaceAll("_", " ")}</h3></div><StatusBadge value={commandPreview.scope} /></header>
            <dl>{Object.entries(commandPreview.proposedChange).map(([key, value]) => <div key={key}><dt>{key.replaceAll(/([A-Z])/g, " $1")}</dt><dd>{value === null ? "No interpretation inferred" : typeof value === "string" ? value : JSON.stringify(value)}</dd></div>)}</dl>
            <form action={confirmOwnerCommandAction} className="command-confirm-form">
              <input type="hidden" name="command" value={commandPreview.command} />
              {commandPreview.requiresConfirmation ? <label className="confirmation-check"><input type="checkbox" name="confirmation" value="confirmed" required /><span>I confirm this scope and proposed change.</span></label> : null}
              {error ? <p className="command-error" role="alert">Confirmation is required before this instruction can be persisted.</p> : null}
              <button className="button button-primary" type="submit">{commandPreview.requiresConfirmation ? "Confirm and record" : "Record command"}</button>
            </form>
          </div>
        ) : null}
      </Panel>

      <div className="controls-grid">
        <Panel title="Emergency pause" description="Stops workers before they claim new generation, scheduling, or publishing work." className={settings.paused ? "control-danger is-paused" : "control-danger"}>
          <div className="pause-control">
            <span className="pause-control-icon">{settings.paused ? <CircleStop size={28} /> : <Pause size={28} />}</span>
            <div><h3>{settings.paused ? "All worker mutations are held" : "Engine workers are permitted to run"}</h3><p>{settings.paused ? "Resume only after the incident or owner concern is resolved." : "The production publishing gate remains independently disabled."}</p></div>
          </div>
          {settings.environmentPauseRequested ? (
            <div className="policy-note"><LockKeyhole size={18} /><div><strong>Deployment kill switch is active.</strong><span>Set `AURENDOR_ENGINE_PAUSED=false` in the deployment secret configuration and restart the worker only after the incident or review is closed.</span></div></div>
          ) : (
            <form action={setEnginePauseAction} className="pause-form">
              <input type="hidden" name="paused" value={settings.paused ? "false" : "true"} />
              <label className="field-label">Reason<input name="reason" required defaultValue={settings.paused ? "Owner resumed operations after review." : "Owner initiated emergency pause from the console."} /></label>
              <button type="submit" className={settings.paused ? "button button-primary" : "button button-danger"}>{settings.paused ? <Play size={16} /> : <Pause size={16} />}{settings.paused ? "Resume engine" : "Pause engine now"}</button>
            </form>
          )}
        </Panel>

        <Panel title="Runtime posture" description="Effective settings from the durable engine configuration.">
          <dl className="control-settings">
            <div><dt>Execution</dt><dd><StatusBadge value={settings.dryRun ? "MANUAL_ONLY" : "AVAILABLE"} label={settings.dryRun ? "Dry run" : "Live execution"} /></dd></div>
            <div><dt>Production publishing</dt><dd><StatusBadge value={settings.productionPublishingEnabled ? "AVAILABLE" : "DISABLED"} label={settings.productionPublishingEnabled ? "Enabled" : "Disabled"} /></dd></div>
            <div><dt>Autonomy stage</dt><dd>{settings.autonomyStage}</dd></div>
            <div><dt>Planning lead</dt><dd>T−{settings.planningLeadDays} days</dd></div>
          </dl>
        </Panel>
      </div>

      <Panel title="Publication authorization chain" description="Every production mutation must satisfy every boundary at the moment of execution.">
        <ol className="safety-chain">
          <li><span><ShieldCheck size={18} /></span><div><strong>Approved intent</strong><p>Strategy and content identity</p></div><Check size={15} /></li>
          <li><span><DatabaseZap size={18} /></span><div><strong>Exact hashes</strong><p>Approved copy, assets, and brand</p></div><Check size={15} /></li>
          <li><span><KeyRound size={18} /></span><div><strong>Signed authority</strong><p>Actor, scope, expiry, revocation</p></div><Check size={15} /></li>
          <li><span><LockKeyhole size={18} /></span><div><strong>Capability preflight</strong><p>Account and operation verified</p></div><Check size={15} /></li>
          <li className="chain-held"><span><AlertOctagon size={18} /></span><div><strong>Production gate</strong><p>Disabled in this environment</p></div><CircleStop size={15} /></li>
        </ol>
      </Panel>

      <div className="control-callout"><AlertOctagon size={19} /><div><strong>Production enablement is intentionally not a casual UI toggle.</strong><span>It requires valid credentials, completed provider verification, secure token storage, a live dry-run rehearsal, and an owner-authorized configuration change.</span></div></div>
    </>
  );
}
