import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="error-page">
      <p className="eyebrow">404 · Outside the system</p>
      <h1>That artifact does not exist.</h1>
      <p>It may have been removed, or the identifier may be incomplete.</p>
      <Link className="button button-primary" href="/"><ArrowLeft size={16} /> Return to command</Link>
    </main>
  );
}
