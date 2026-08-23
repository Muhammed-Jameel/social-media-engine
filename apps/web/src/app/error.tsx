"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="error-page">
      <span className="error-icon"><AlertTriangle size={27} /></span>
      <p className="eyebrow">Operational interruption</p>
      <h1>This view could not be assembled.</h1>
      <p>The engine preserved the last durable state. Check the database and runtime configuration, then retry.</p>
      <button type="button" className="button button-primary" onClick={() => reset()}><RotateCcw size={16} /> Try again</button>
    </main>
  );
}
