import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export function RegisterDialog({
  open,
  onClose,
  eventTitle,
  workshopId,
  externalUrl,
}: {
  open: boolean;
  onClose: () => void;
  eventTitle: string;
  workshopId: string | null;
  externalUrl?: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setDone(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.from("event_registrations").insert({
      workshop_id: workshopId,
      event_title: eventTitle,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      branch: branch.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
    });
    setSubmitting(false);
    if (err) {
      setError(err.message || "Could not submit. Try again.");
      return;
    }
    setDone(true);
    setFullName(""); setEmail(""); setPhone(""); setBranch(""); setNotes("");
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg border border-foreground bg-background p-6 md:p-8 shadow-[8px_8px_0_0_var(--color-foreground)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 border border-hairline bg-background p-2 font-mono text-xs tap-target"
        >
          ✕
        </button>

        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
          [ REGISTRATION ]
        </div>
        <h3 id="register-title" className="mt-2 font-display text-2xl leading-tight text-foreground md:text-3xl">
          {eventTitle}
        </h3>

        {done ? (
          <div className="mt-6 border border-signal bg-surface p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
              [ SEAT LOCKED ]
            </div>
            <p className="mt-2 text-sm text-foreground">
              You're on the list for <strong>{eventTitle}</strong>. We'll email
              you the details closer to the day.
            </p>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost mt-4 inline-flex"
              >
                → OPEN FULL FORM
              </a>
            )}
            <div className="mt-4">
              <button type="button" onClick={onClose} className="btn-brutal btn-brutal-hover">
                DONE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Full name
              <input
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                Phone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
                />
              </label>
              <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                Branch / Year
                <input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CT · S3"
                  className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
                />
              </label>
            </div>
            <label className="grid gap-1.5 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Notes (optional)
              <textarea
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Squad name, dietary preference, anything else"
                className="border border-hairline bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-foreground focus:border-signal focus:outline-none"
              />
            </label>

            {error && (
              <div className="border border-destructive bg-surface p-3 font-mono text-[11px] uppercase tracking-[0.24em] text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal btn-brutal-hover disabled:opacity-60"
              >
                {submitting ? "SUBMITTING…" : "→ LOCK MY SEAT"}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost">
                CANCEL
              </button>
            </div>
            <p className="pt-1 text-[11px] text-muted-foreground">
              We store this on the ARCHERZ dashboard. Only team leads can see it.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegisterDialog;
