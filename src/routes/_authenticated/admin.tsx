import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — ARCHERZ" }] }),
  component: AdminPage,
});

type Role = "admin" | "it_admin" | "coordinator";
type Workshop = {
  id: string;
  slug: string;
  code: string;
  title: string;
  body: string;
  long_description: string | null;
  image_url: string | null;
  event_date: string | null;
  duration: string | null;
  status: string;
  register_url: string | null;
  ordering: number;
  is_published: boolean;
  created_by: string | null;
};

function AdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [uid, setUid] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [requests, setRequests] = useState<
    Array<{ id: string; kind: string; payload: Record<string, unknown>; status: string; created_at: string }>
  >([]);
  const [tab, setTab] = useState<"cards" | "requests" | "team" | "members">("cards");
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = roles.includes("admin") || roles.includes("it_admin");
  const isCoord = roles.includes("coordinator");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      setUid(u.user.id);
      const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      setRoles((rs ?? []).map((r) => r.role as Role));
      await refresh();
    })();
  }, []);

  async function refresh() {
    const { data: ws } = await supabase
      .from("workshops")
      .select("*")
      .order("ordering", { ascending: true });
    setWorkshops((ws ?? []) as Workshop[]);
    const { data: rq } = await supabase
      .from("change_requests")
      .select("id,kind,payload,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((rq ?? []) as typeof requests);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function saveWorkshop(w: Workshop, publish: boolean) {
    if (isAdmin) {
      const { id, ...rest } = w;
      const { error } = await supabase
        .from("workshops")
        .update({ ...rest, is_published: publish })
        .eq("id", id);
      if (error) return alert(error.message);
    } else if (isCoord) {
      const { error } = await supabase.from("change_requests").insert({
        requested_by: uid,
        kind: "workshop_update",
        target_id: w.id,
        payload: JSON.parse(JSON.stringify(w)),
      });
      if (error) return alert(error.message);
      alert("Change submitted for admin review.");
    }
    setEditing(null);
    await refresh();
  }

  async function createWorkshop(w: Omit<Workshop, "id" | "created_by">) {
    if (isAdmin) {
      const { error } = await supabase.from("workshops").insert({ ...w, created_by: uid });
      if (error) return alert(error.message);
    } else if (isCoord) {
      const { error } = await supabase.from("workshops").insert({
        ...w,
        is_published: false,
        created_by: uid,
      });
      if (error) return alert(error.message);
      alert("Draft created — an admin will publish it.");
    }
    setCreating(false);
    await refresh();
  }

  async function deleteWorkshop(id: string) {
    if (!confirm("Delete this card?")) return;
    const { error } = await supabase.from("workshops").delete().eq("id", id);
    if (error) return alert(error.message);
    await refresh();
  }

  async function approve(rid: string, r: (typeof requests)[number]) {
    if (r.kind === "workshop_update" && r.payload) {
      const p = r.payload as unknown as Workshop;
      const { id, created_by: _cb, ...rest } = p;
      await supabase.from("workshops").update(rest).eq("id", id);
    }
    await supabase
      .from("change_requests")
      .update({ status: "approved", reviewer_id: uid, reviewed_at: new Date().toISOString() })
      .eq("id", rid);
    await refresh();
  }

  async function reject(rid: string) {
    await supabase
      .from("change_requests")
      .update({ status: "rejected", reviewer_id: uid, reviewed_at: new Date().toISOString() })
      .eq("id", rid);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            ← ARCHERZ / ADMIN
          </Link>
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.24em]">
            <span className="text-muted-foreground">{email}</span>
            <span className="border border-hairline px-2 py-1 text-signal">
              {roles.length ? roles.join(" · ") : "no role"}
            </span>
            <button onClick={signOut} className="btn-ghost !px-3 !py-1">
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10">
        {roles.length === 0 && (
          <div className="mb-8 border border-signal bg-surface p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
              [ NO ROLE ASSIGNED ]
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You are signed in but have no role yet. Ask an admin to grant you a role.
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
          {(["cards", "requests", "team", ...(isAdmin ? (["members"] as const) : [])] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border px-4 py-2 ${
                tab === t ? "border-signal text-signal" : "border-hairline text-muted-foreground"
              }`}
            >
              {t}
              {t === "requests" && requests.length > 0 && (
                <span className="ml-2 rounded-full bg-signal px-2 py-0.5 text-[10px] text-background">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "cards" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-display text-3xl tracking-tight md:text-5xl">Event cards</h1>
              {(isAdmin || isCoord) && (
                <button onClick={() => setCreating(true)} className="btn-brutal btn-brutal-hover">
                  + ADD CARD
                </button>
              )}
            </div>
            <div className="border-t border-hairline">
              {workshops.map((w) => (
                <div
                  key={w.id}
                  className="grid grid-cols-[80px_1fr_auto] items-center gap-4 border-b border-hairline py-4"
                >
                  <div className="font-mono text-xs text-signal">{w.code}</div>
                  <div>
                    <div className="font-display text-xl">{w.title}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      {w.event_date ?? "—"} · {w.status} ·{" "}
                      <span className={w.is_published ? "text-signal" : "text-foreground"}>
                        {w.is_published ? "PUBLISHED" : "DRAFT"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
                    <button
                      onClick={() => setEditing(w)}
                      className="border border-hairline px-3 py-1 hover:border-signal"
                    >
                      EDIT
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => deleteWorkshop(w.id)}
                        className="border border-hairline px-3 py-1 hover:border-signal"
                      >
                        DEL
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div>
            <h1 className="mb-6 font-display text-3xl tracking-tight md:text-5xl">
              Pending requests
            </h1>
            {requests.length === 0 && (
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                [ INBOX EMPTY ]
              </p>
            )}
            <div className="grid gap-4">
              {requests.map((r) => (
                <div key={r.id} className="border border-hairline bg-surface p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
                    {r.kind}
                  </div>
                  <pre className="mt-3 overflow-auto text-[11px] text-muted-foreground">
                    {JSON.stringify(r.payload, null, 2)}
                  </pre>
                  {isAdmin && (
                    <div className="mt-4 flex gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
                      <button onClick={() => approve(r.id, r)} className="btn-brutal btn-brutal-hover">
                        APPROVE
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        className="border border-hairline px-3 py-2"
                      >
                        REJECT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "team" && (
          <TeamPanel isAdmin={isAdmin} onChanged={refresh} />
        )}
      </div>

      {(editing || creating) && (
        <WorkshopEditor
          initial={editing ?? undefined}
          canPublish={isAdmin}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSubmit={(payload, publish) => {
            if (editing) saveWorkshop({ ...editing, ...payload }, publish);
            else createWorkshop({ ...payload, is_published: publish });
          }}
        />
      )}
    </div>
  );
}

function WorkshopEditor({
  initial,
  canPublish,
  onCancel,
  onSubmit,
}: {
  initial?: Workshop;
  canPublish: boolean;
  onCancel: () => void;
  onSubmit: (w: Omit<Workshop, "id" | "created_by">, publish: boolean) => void;
}) {
  const [f, setF] = useState<Omit<Workshop, "id" | "created_by">>({
    slug: initial?.slug ?? "",
    code: initial?.code ?? "MOD_0X",
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    long_description: initial?.long_description ?? "",
    image_url: initial?.image_url ?? "",
    event_date: initial?.event_date ?? "",
    duration: initial?.duration ?? "",
    status: initial?.status ?? "OPEN",
    register_url: initial?.register_url ?? "https://forms.gle/KMNC6zrhtcqRcShaA",
    ordering: initial?.ordering ?? 99,
    is_published: initial?.is_published ?? false,
  });

  function submit(e: FormEvent, publish: boolean) {
    e.preventDefault();
    if (!f.slug || !f.title) return alert("Slug and title required");
    onSubmit(f, publish);
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/90 p-4">
      <form className="w-full max-w-2xl max-h-[90vh] overflow-auto border border-hairline bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-2xl">{initial ? "Edit card" : "New card"}</div>
          <button type="button" onClick={onCancel} className="font-mono text-xs">
            CLOSE ✕
          </button>
        </div>
        <div className="grid gap-4">
          {(
            [
              ["code", "CODE (e.g. MOD_04)"],
              ["slug", "SLUG (url-safe, unique)"],
              ["title", "TITLE"],
              ["body", "SHORT DESCRIPTION"],
              ["long_description", "LONG DESCRIPTION"],
              ["image_url", "IMAGE URL"],
              ["event_date", "DATE (e.g. OCT 12)"],
              ["duration", "DURATION (e.g. 3H)"],
              ["status", "STATUS (OPEN / QUEUED / CLOSED)"],
              ["register_url", "REGISTER URL"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
                {label}
              </span>
              {key === "long_description" || key === "body" ? (
                <textarea
                  value={String((f as unknown as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) => setF({ ...f, [key]: e.target.value })}
                  rows={key === "long_description" ? 4 : 2}
                  className="mt-2 block w-full border border-hairline bg-background px-3 py-2 text-sm"
                />
              ) : (
                <input
                  value={String((f as unknown as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) => setF({ ...f, [key]: e.target.value })}
                  className="mt-2 block w-full border border-hairline bg-background px-3 py-2 text-sm"
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={(e) => submit(e, false)} className="border border-hairline px-4 py-2 font-mono text-xs uppercase tracking-[0.24em]">
            SAVE AS DRAFT
          </button>
          {canPublish && (
            <button onClick={(e) => submit(e, true)} className="btn-brutal btn-brutal-hover">
              → PUBLISH
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function TeamPanel({ isAdmin, onChanged }: { isAdmin: boolean; onChanged: () => void }) {
  const [list, setList] = useState<
    Array<{ user_id: string; role: Role; email: string | null; display_name: string | null }>
  >([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("coordinator");

  useEffect(() => {
    (async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id, role");
      const ids = Array.from(new Set((rs ?? []).map((r) => r.user_id)));
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const map = new Map((ps ?? []).map((p) => [p.id, p]));
      setList(
        (rs ?? []).map((r) => ({
          user_id: r.user_id,
          role: r.role as Role,
          email: map.get(r.user_id)?.email ?? null,
          display_name: map.get(r.user_id)?.display_name ?? null,
        })),
      );
    })();
  }, [onChanged]);

  async function grant(e: FormEvent) {
    e.preventDefault();
    const { data: p } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!p) return alert("No user with that email has signed in yet.");
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role });
    if (error) return alert(error.message);
    setEmail("");
    onChanged();
  }
  async function revoke(user_id: string, role: Role) {
    await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
    onChanged();
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-tight md:text-5xl">Team & roles</h1>
      {isAdmin && (
        <form onSubmit={grant} className="mb-8 flex flex-wrap gap-3">
          <input
            required
            type="email"
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-hairline bg-background px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="border border-hairline bg-background px-3 py-2 font-mono text-xs uppercase"
          >
            <option value="coordinator">coordinator</option>
            <option value="admin">admin</option>
            <option value="it_admin">it_admin</option>
          </select>
          <button className="btn-brutal btn-brutal-hover">+ GRANT</button>
        </form>
      )}
      <div className="border-t border-hairline">
        {list.map((r) => (
          <div
            key={r.user_id + r.role}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-hairline py-3 font-mono text-xs"
          >
            <div>
              <div className="text-foreground">{r.display_name ?? r.email ?? r.user_id}</div>
              <div className="text-muted-foreground">{r.email}</div>
            </div>
            <div className="text-signal uppercase tracking-[0.24em]">{r.role}</div>
            {isAdmin && (
              <button
                onClick={() => revoke(r.user_id, r.role)}
                className="border border-hairline px-3 py-1"
              >
                REVOKE
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
