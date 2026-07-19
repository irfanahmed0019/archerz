import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { adminCreateUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — ARCHERZ" }] }),
  component: AdminPage,
});

type Role = "admin" | "it_admin" | "coordinator" | "normal";
type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at?: string | null;
};
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
  is_featured?: boolean;
  created_by: string | null;
};


function AdminPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [uid, setUid] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [requests, setRequests] = useState<
    Array<{ id: string; kind: string; payload: Record<string, unknown>; status: string; created_at: string }>
  >([]);
  const [tab, setTab] = useState<"dashboard" | "cards" | "requests" | "registrations" | "team" | "members" | "users" | "settings">("dashboard");
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = roles.includes("admin") || roles.includes("it_admin");
  const isCoord = roles.includes("coordinator");
  const isStaff = isAdmin || isCoord;
  const displayName = profile?.display_name || email.split("@")[0] || "Archer";

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      setUid(u.user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .eq("id", u.user.id)
        .maybeSingle();
      setProfile((p ?? null) as Profile | null);
      const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const nextRoles = (rs ?? []).map((r) => r.role as Role);
      setRoles(nextRoles.length ? nextRoles : ["normal"]);
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

  async function setFeatured(id: string, featured: boolean) {
    if (featured) {
      // Ensure only one featured — demote any current featured first
      await supabase.from("workshops").update({ is_featured: false }).eq("is_featured", true);
    }
    const { error } = await supabase.from("workshops").update({ is_featured: featured }).eq("id", id);
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
            ← ARCHERZ / DASHBOARD
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
          {(["dashboard", ...(isStaff ? (["cards", "requests", "registrations", "team"] as const) : []), ...(isAdmin ? (["members", "users", "settings"] as const) : [])] as const).map((t) => (
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

        {tab === "dashboard" && (
          <MemberDashboard
            displayName={displayName}
            email={email}
            roles={roles}
            workshops={workshops}
            isStaff={isStaff}
            onManage={() => setTab("cards")}
          />
        )}

        {tab === "cards" && isStaff && (
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
                    <div className="font-display text-xl">
                      {w.title}
                      {w.is_featured && (
                        <span className="ml-2 border border-signal px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-[0.24em] text-signal">
                          ★ MAIN POSTER
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      {w.event_date ?? "—"} · {w.status} ·{" "}
                      <span className={w.is_published ? "text-signal" : "text-foreground"}>
                        {w.is_published ? "PUBLISHED" : "DRAFT"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
                    {isAdmin && (
                      <button
                        onClick={() => setFeatured(w.id, !w.is_featured)}
                        className={`border px-3 py-1 hover:border-signal ${
                          w.is_featured ? "border-signal text-signal" : "border-hairline"
                        }`}
                        title={w.is_featured ? "Remove from main poster" : "Promote to main poster"}
                      >
                        {w.is_featured ? "DEMOTE" : "PROMOTE"}
                      </button>
                    )}
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

        {tab === "requests" && isStaff && (
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

        {tab === "team" && isStaff && (
          <TeamPanel isAdmin={isAdmin} onChanged={refresh} />
        )}

        {tab === "registrations" && isStaff && <RegistrationsPanel canManage={isAdmin} />}


        {tab === "members" && isAdmin && <TeamMembersPanel />}

        {tab === "users" && isAdmin && <MembersPanel />}

        {tab === "settings" && isAdmin && <SettingsPanel />}
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

function MemberDashboard({
  displayName,
  email,
  roles,
  workshops,
  isStaff,
  onManage,
}: {
  displayName: string;
  email: string;
  roles: Role[];
  workshops: Workshop[];
  isStaff: boolean;
  onManage: () => void;
}) {
  const nextEvent = workshops.find((w) => w.is_published && w.status.toLowerCase() !== "closed") ?? workshops[0];
  const drafts = workshops.filter((w) => !w.is_published);
  const plans = workshops.filter((w) => w.is_published);

  return (
    <div>
      <section className="grid gap-8 border-b border-hairline pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            [ MEMBER SIGNAL ACTIVE ]
          </div>
          <h1 className="mt-4 font-display text-4xl tracking-tight md:text-7xl">
            Welcome, {displayName}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Thanks for being part of ARCHERZ. This is your own member dashboard for upcoming events, planning notes, and internal drafts.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
            {(roles.length ? roles : ["normal"]).map((role) => (
              <span key={role} className="border border-hairline bg-surface px-3 py-2 text-signal">
                {role.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
        <div className="border border-hairline bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            Signed in as
          </div>
          <div className="mt-2 break-all font-mono text-sm text-foreground">{email}</div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center font-mono uppercase tracking-[0.18em]">
            <Metric label="Events" value={String(plans.length)} />
            <Metric label="Drafts" value={String(drafts.length)} />
            <Metric label="Role" value={isStaff ? "Staff" : "Member"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-hairline bg-surface p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
            Next event
          </div>
          {nextEvent ? (
            <>
              <h2 className="mt-4 font-display text-3xl tracking-tight">{nextEvent.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{nextEvent.body}</p>
              <div className="mt-5 grid gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                <span>{nextEvent.event_date ?? "Date queued"}</span>
                <span>{nextEvent.duration ?? "Duration soon"}</span>
                <span className="text-signal">{nextEvent.status}</span>
              </div>
              {nextEvent.register_url && (
                <a href={nextEvent.register_url} className="mt-6 btn-brutal btn-brutal-hover">
                  → REGISTER
                </a>
              )}
            </>
          ) : (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              [ NEXT EVENT WILL APPEAR HERE ]
            </p>
          )}
        </div>

        <div className="grid gap-6">
          <div className="border border-hairline bg-background p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
              Website planning
            </div>
            <div className="mt-5 grid gap-3">
              {plans.slice(0, 4).map((w) => (
                <PlanRow key={w.id} code={w.code} title={w.title} status={w.status} label="live" />
              ))}
              {plans.length === 0 && <EmptyLine text="No live planning items yet" />}
            </div>
          </div>

          <div className="border border-hairline bg-background p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-signal">
              Internal drafts
            </div>
            <div className="mt-5 grid gap-3">
              {drafts.slice(0, 4).map((w) => (
                <PlanRow key={w.id} code={w.code} title={w.title} status={w.status} label="draft" />
              ))}
              {drafts.length === 0 && <EmptyLine text="No draft items in the queue" />}
            </div>
          </div>
        </div>
      </section>

      {isStaff && (
        <button onClick={onManage} className="btn-brutal btn-brutal-hover">
          → OPEN MANAGEMENT TOOLS
        </button>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline bg-background p-3">
      <div className="text-lg text-foreground">{value}</div>
      <div className="mt-1 text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}

function PlanRow({ code, title, status, label }: { code: string; title: string; status: string; label: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border-b border-hairline pb-3 font-mono text-xs last:border-b-0 last:pb-0">
      <span className="text-signal">{code}</span>
      <span className="text-foreground">{title}</span>
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {label} · {status}
      </span>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
      [ {text} ]
    </p>
  );
}

function TeamPanel({ isAdmin, onChanged }: { isAdmin: boolean; onChanged: () => void }) {
  const [list, setList] = useState<
    Array<{ user_id: string; role: Role; email: string | null; display_name: string | null }>
  >([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("coordinator");

  async function loadRoles() {
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
  }

  useEffect(() => {
    loadRoles();
  }, []);

  async function grant(e: FormEvent) {
    e.preventDefault();
    const { data: p } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!p) return alert("No user with that email has signed in yet.");
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role });
    if (error) return alert(error.message);
    setEmail("");
    onChanged();
    await loadRoles();
  }
  async function revoke(user_id: string, role: Role) {
    await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
    onChanged();
    await loadRoles();
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
            <option value="normal">normal</option>
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

function MembersPanel() {
  type Member = {
    id: string;
    email: string | null;
    display_name: string | null;
    created_at?: string | null;
    roles: Role[];
  };
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [nEmail, setNEmail] = useState("");
  const [nPass, setNPass] = useState("");
  const [nName, setNName] = useState("");
  const [nRole, setNRole] = useState<Role>("normal");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const createUser = useServerFn(adminCreateUser);

  async function loadMembers() {
    const { data: ps } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: false });
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, Role[]>();
    (rs ?? []).forEach((r) => {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role as Role);
      roleMap.set(r.user_id, list);
    });
    setMembers(
      ((ps ?? []) as Array<Omit<Member, "roles">>).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
      })),
    );
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await createUser({ data: { email: nEmail, password: nPass, displayName: nName, role: nRole } });
      setMsg(`Created ${nEmail}`);
      setNEmail(""); setNPass(""); setNName(""); setNRole("normal");
      await loadMembers();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole(user_id: string, role: Role, has: boolean) {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) return alert(error.message);
    }
    await loadMembers();
  }

  const filtered = members.filter(
    (m) =>
      !q ||
      (m.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (m.display_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const ROLES: Role[] = ["admin", "it_admin", "coordinator", "normal"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight md:text-5xl">
          All members <span className="text-signal">/ {members.length}</span>
        </h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search email or name"
            className="border border-hairline bg-background px-3 py-2 font-mono text-xs"
          />
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="border border-signal px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-signal"
          >
            {showCreate ? "Close" : "+ New user"}
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 grid gap-3 border border-hairline bg-surface p-5 md:grid-cols-5">
          <input required type="email" placeholder="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} className="border border-hairline bg-background px-3 py-2 font-mono text-xs md:col-span-2" />
          <input required type="text" placeholder="display name" value={nName} onChange={(e) => setNName(e.target.value)} className="border border-hairline bg-background px-3 py-2 font-mono text-xs" />
          <input required type="password" placeholder="password (min 8)" value={nPass} onChange={(e) => setNPass(e.target.value)} minLength={8} className="border border-hairline bg-background px-3 py-2 font-mono text-xs" />
          <select value={nRole} onChange={(e) => setNRole(e.target.value as Role)} className="border border-hairline bg-background px-3 py-2 font-mono text-xs">
            <option value="normal">normal</option>
            <option value="coordinator">coordinator</option>
            <option value="it_admin">it_admin</option>
            <option value="admin">admin</option>
          </select>
          <div className="md:col-span-5 flex items-center justify-between gap-4">
            {msg && <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">{msg}</span>}
            <button type="submit" disabled={busy} className="ml-auto border border-signal bg-signal px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-background disabled:opacity-50">
              {busy ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      )}

      <div className="border-t border-hairline">
        <div className="hidden md:grid grid-cols-[1.2fr_1.4fr_2fr_auto] gap-4 border-b border-hairline py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          <div>NAME</div>
          <div>EMAIL</div>
          <div>ROLES · click to toggle</div>
          <div>JOINED</div>
        </div>
        {filtered.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_2fr_auto] gap-3 md:gap-4 border-b border-hairline py-4 font-mono text-xs"
          >
            <div className="text-foreground">{m.display_name ?? "—"}</div>
            <div className="text-muted-foreground break-all">{m.email ?? "—"}</div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const has = m.roles.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRole(m.id, r, has)}
                    className={
                      "border px-2 py-1 uppercase tracking-[0.2em] text-[10px] transition " +
                      (has
                        ? "border-signal bg-signal text-background"
                        : "border-hairline text-muted-foreground hover:text-foreground")
                    }
                    title={has ? `Revoke ${r}` : `Grant ${r}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <div className="text-signal md:text-right">
              {m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            [ NO MEMBERS ]
          </p>
        )}
      </div>
    </div>
  );
}


function TeamMembersPanel() {
  const [rows, setRows] = useState<
    Array<{ user_id: string; roles: Role[]; email: string | null; display_name: string | null }>
  >([]);
  const [q, setQ] = useState("");

  async function load() {
    const teamRoles: Role[] = ["admin", "it_admin", "coordinator"];
    const { data: rs } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", teamRoles);
    const grouped = new Map<string, Role[]>();
    (rs ?? []).forEach((r) => {
      const list = grouped.get(r.user_id) ?? [];
      list.push(r.role as Role);
      grouped.set(r.user_id, list);
    });
    const ids = Array.from(grouped.keys());
    const { data: ps } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const pmap = new Map((ps ?? []).map((p) => [p.id, p]));
    setRows(
      ids.map((id) => ({
        user_id: id,
        roles: grouped.get(id) ?? [],
        email: pmap.get(id)?.email ?? null,
        display_name: pmap.get(id)?.display_name ?? null,
      })),
    );
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      (r.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight md:text-5xl">
          Team members <span className="text-signal">/ {rows.length}</span>
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search email or name"
          className="border border-hairline bg-background px-3 py-2 font-mono text-xs"
        />
      </div>
      <div className="border-t border-hairline">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-hairline py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          <div>NAME</div>
          <div>EMAIL</div>
          <div>ROLES</div>
        </div>
        {filtered.map((r) => (
          <div
            key={r.user_id}
            className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-hairline py-3 font-mono text-xs"
          >
            <div className="text-foreground">{r.display_name ?? "—"}</div>
            <div className="text-muted-foreground">{r.email ?? "—"}</div>
            <div className="text-signal uppercase tracking-[0.24em]">{r.roles.join(" · ")}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            [ NO TEAM MEMBERS ]
          </p>
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "chatbot_enabled")
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(!(data && (data.value === false || data.value === "false")));
      });
  }, []);

  async function toggle() {
    if (enabled === null) return;
    const next = !enabled;
    setSaving(true);
    setErr(null);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "chatbot_enabled", value: next as unknown as never, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setEnabled(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">[ SETTINGS ]</div>
        <h2 className="mt-2 font-display text-3xl">Site controls</h2>
        <p className="mt-1 text-sm text-muted-foreground">Toggle features across the whole site.</p>
      </div>

      <div className="flex items-center justify-between border border-hairline bg-surface p-5">
        <div>
          <div className="font-display text-lg">ARCHERZ AI chatbot</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The floating AI bubble on every page. Turn off to hide it and block all requests.
          </p>
        </div>
        <button
          type="button"
          disabled={enabled === null || saving}
          onClick={toggle}
          className={`min-w-[110px] border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] ${
            enabled ? "border-signal text-signal" : "border-hairline text-muted-foreground"
          } disabled:opacity-50`}
        >
          {enabled === null ? "…" : enabled ? "ON — click to disable" : "OFF — click to enable"}
        </button>
      </div>

      <VercelDeployHelper />

      {err && (
        <div className="border border-signal bg-signal/5 p-3 font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
          {err}
        </div>
      )}
    </div>
  );
}

function VercelDeployHelper() {
  const [copied, setCopied] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const secretName = "LOVABLE_API_KEY";
  const lovableSecrets =
    "https://lovable.dev/projects/f121f496-ded9-4590-a2e5-02383200aff0?view=more&subview=cloud&section=secrets";
  const vercelEnv = "https://vercel.com/dashboard"; // Vercel doesn't expose stable per-project deep links
  const vercelDocs = "https://vercel.com/docs/projects/environment-variables";

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
    } catch {
      // noop
    }
  }

  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: "Rotate & copy the key",
      body: (
        <>
          <p>
            The current <code className="font-mono">LOVABLE_API_KEY</code> value is hidden and can
            never be revealed. Rotate to mint a new one — it's shown{" "}
            <span className="text-signal">once</span>, so copy it right away.
          </p>
          <a
            href={lovableSecrets}
            target="_blank"
            rel="noreferrer"
            className="btn-brutal btn-brutal-hover mt-3 inline-flex"
          >
            → OPEN LOVABLE SECRETS
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            The old key keeps working for ~1 hour so nothing breaks mid-swap.
          </p>
        </>
      ),
    },
    {
      title: "Paste it into Vercel",
      body: (
        <>
          <p>
            Open your Vercel project → <b>Settings</b> → <b>Environment Variables</b>. Add a new
            variable with this exact name for <b>Production</b>, <b>Preview</b>, and{" "}
            <b>Development</b>:
          </p>
          <div className="mt-3 flex items-center gap-2 border border-hairline bg-background px-3 py-2 font-mono text-sm">
            <span className="flex-1">{secretName}</span>
            <button
              type="button"
              onClick={() => copy(secretName, "name")}
              className="border border-hairline px-2 py-1 text-[10px] uppercase tracking-[0.2em] hover:bg-surface"
            >
              {copied === "name" ? "COPIED" : "COPY"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Paste the value you copied from Lovable. Save.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={vercelEnv}
              target="_blank"
              rel="noreferrer"
              className="border border-hairline px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] hover:bg-surface"
            >
              → OPEN VERCEL DASHBOARD
            </a>
            <a
              href={vercelDocs}
              target="_blank"
              rel="noreferrer"
              className="border border-hairline px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] hover:bg-surface"
            >
              DOCS
            </a>
          </div>
        </>
      ),
    },
    {
      title: "Redeploy",
      body: (
        <>
          <p>
            In Vercel, go to <b>Deployments</b> → latest deployment → <b>⋯</b> → <b>Redeploy</b>.
            Uncheck <i>"use existing build cache"</i> so the new env var is picked up.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            After the deploy finishes, open your Vercel URL, click the AI bubble, and send a test
            message.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="border border-hairline bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="font-display text-lg">Deploy LOVABLE_API_KEY to Vercel</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            3-step helper. Rotate in Lovable, paste in Vercel, redeploy.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {step + 1} / {steps.length}
        </div>
      </div>

      <div className="mt-4 flex gap-1">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`h-1 flex-1 ${i <= step ? "bg-signal" : "bg-hairline"}`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
          Step {step + 1}. {steps[step].title}
        </div>
        <div className="space-y-2 text-foreground">{steps[step].body}</div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="border border-hairline px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] hover:bg-surface disabled:opacity-40"
        >
          ← Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="btn-brutal btn-brutal-hover"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="border border-signal px-3 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-signal hover:bg-signal/5"
          >
            Restart
          </button>
        )}
      </div>
    </div>
  );
}

type Registration = {
  id: string;
  workshop_id: string | null;
  event_title: string;
  full_name: string;
  email: string;
  phone: string | null;
  branch: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

function RegistrationsPanel({ canManage }: { canManage: boolean }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Registration[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("event_registrations").update({ status }).eq("id", id);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    await supabase.from("event_registrations").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const exportCsv = () => {
    const header = ["created_at", "event_title", "full_name", "email", "phone", "branch", "status", "notes"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header.join(","), ...filtered.map((r) => header.map((h) => escape((r as unknown as Record<string, unknown>)[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archerz-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-signal">
            [ REGISTRATIONS ]
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone who submitted the event register form. {rows.length} total.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
          {(["all", "pending", "confirmed", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`border px-3 py-1.5 ${filter === f ? "border-signal text-signal" : "border-hairline text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
          <button onClick={load} className="border border-hairline px-3 py-1.5">↻ REFRESH</button>
          <button onClick={exportCsv} className="border border-foreground bg-foreground px-3 py-1.5 text-background">↓ CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="border border-hairline bg-surface p-6 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-hairline bg-surface p-6 text-sm text-muted-foreground">
          No registrations yet.
        </div>
      ) : (
        <div className="border border-hairline">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-surface font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="border-b border-hairline px-3 py-2 text-left">When</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Event</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Name</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Contact</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Branch</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Status</th>
                  <th className="border-b border-hairline px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="border-b border-hairline px-3 py-3 text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-sm">{r.event_title}</td>
                    <td className="border-b border-hairline px-3 py-3 text-sm font-medium">
                      {r.full_name}
                      {r.notes && (
                        <div className="mt-1 text-[11px] text-muted-foreground">"{r.notes}"</div>
                      )}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-[12px]">
                      <div>{r.email}</div>
                      {r.phone && <div className="text-muted-foreground">{r.phone}</div>}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-[12px] text-muted-foreground">{r.branch ?? "—"}</td>
                    <td className="border-b border-hairline px-3 py-3">
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.24em] px-2 py-1 border ${
                          r.status === "confirmed"
                            ? "border-signal text-signal"
                            : r.status === "rejected"
                              ? "border-destructive text-destructive"
                              : "border-hairline text-muted-foreground"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-3 py-3">
                      {canManage ? (
                        <div className="flex flex-wrap gap-1 font-mono text-[10px] uppercase tracking-[0.22em]">
                          <button onClick={() => setStatus(r.id, "confirmed")} className="border border-signal px-2 py-1 text-signal">Confirm</button>
                          <button onClick={() => setStatus(r.id, "rejected")} className="border border-hairline px-2 py-1 text-muted-foreground">Reject</button>
                          <button onClick={() => remove(r.id)} className="border border-destructive px-2 py-1 text-destructive">Del</button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">view only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

