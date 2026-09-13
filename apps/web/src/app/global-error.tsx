"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="error-page">
          <p className="eyebrow">SOCIAL_MEDIA_PLUGIN Content OS</p>
          <h1>The console encountered a critical error.</h1>
          <p>No publishing action was inferred or retried. Restart the surface when ready.</p>
          <button type="button" className="button button-primary" onClick={() => reset()}>Restart console</button>
        </main>
      </body>
    </html>
  );
}
