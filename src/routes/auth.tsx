import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ARCHERZ" }] }),
  component: AuthPage,
});

const PENDING_MSG =
  "Your login information has been sent to the admin. After review, your access will be approved.";

async function gateAfterAuth(): Promise<{ allowed: boolean; message?: string }> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { allowed: false };
  const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
  const roles = (rs ?? []).map((r) => r.role as string);
  const isStaff = roles.some((r) => r === "admin" || r === "it_admin" || r === "coordinator");
  if (isStaff) return { allowed: true };
  // Not staff — file an access request (best-effort, ignore duplicates) and sign out.
  await supabase.from("change_requests").insert({
    requested_by: u.user.id,
    kind: "access_request",
    payload: { email: u.user.email, full_name: u.user.user_metadata?.full_name ?? null },
  });
  await supabase.auth.signOut();
  return { allowed: false, message: PENDING_MSG };
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const gate = await gateAfterAuth();
      if (gate.allowed) navigate({ to: "/admin", replace: true });
      else if (gate.message) setStatus(gate.message);
    })();
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setStatus(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setStatus(PENDING_MSG);
          setMode("signin");
          return;
        }
      }
      const gate = await gateAfterAuth();
      if (gate.allowed) navigate({ to: "/admin", replace: true });
      else setStatus(gate.message ?? PENDING_MSG);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null);
    setStatus(null);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      setErr(r.error instanceof Error ? r.error.message : String(r.error));
      return;
    }
    if (r.redirected) return;
    const gate = await gateAfterAuth();
    if (gate.allowed) navigate({ to: "/admin", replace: true });
    else setStatus(gate.message ?? PENDING_MSG);
  }


  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-hairline bg-surface p-8">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
          ← ARCHERZ
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-tight">
          {mode === "signin" ? "Sign in." : "Create account."}
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          [ MEMBER / COORDINATOR / ADMIN ACCESS ]
        </p>

        <button
          onClick={google}
          className="mt-8 w-full border border-hairline bg-background px-4 py-3 font-mono text-xs uppercase tracking-[0.24em] hover:bg-surface"
        >
          → CONTINUE WITH GOOGLE
        </button>

        <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          <div className="h-px flex-1 bg-hairline" /> OR <div className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          {mode === "signup" && (
            <Field label="NAME" type="text" value={name} onChange={setName} required />
          )}
          <Field label="EMAIL" type="email" value={email} onChange={setEmail} required />
          <Field label="PASSWORD" type="password" value={password} onChange={setPassword} required />
          {status && <div className="border border-hairline bg-background p-3 font-mono text-xs text-foreground">{status}</div>}
          {err && <div className="font-mono text-xs text-signal">{err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="btn-brutal btn-brutal-hover justify-center disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "→ SIGN IN" : "→ CREATE ACCOUNT"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-2 block w-full border-b border-hairline bg-transparent px-1 py-3 font-mono text-sm text-foreground focus:border-signal focus:outline-none"
      />
    </label>
  );
}
