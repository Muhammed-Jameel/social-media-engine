"use client";

import { Send } from "lucide-react";
import { useFormStatus } from "react-dom";

export function PublishSubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" className="button button-primary button-wide" disabled={pending}><Send size={16} />{pending ? "Sending to Postiz…" : "Send exact package to Postiz"}</button>;
}
