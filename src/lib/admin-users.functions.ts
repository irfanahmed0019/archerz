import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "admin" | "it_admin" | "coordinator" | "normal";

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { email: string; password: string; displayName?: string; role?: Role }) => {
      const email = String(input.email ?? "").trim().toLowerCase();
      const password = String(input.password ?? "");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      const role: Role = (input.role ?? "normal") as Role;
      if (!["admin", "it_admin", "coordinator", "normal"].includes(role)) {
        throw new Error("Invalid role");
      }
      return {
        email,
        password,
        displayName: String(input.displayName ?? "").trim().slice(0, 120),
        role,
      };
    },
  )
  .handler(async ({ data, context }) => {
    // Verify caller is admin or it_admin
    const { data: myRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (myRoles ?? []).map((r) => r.role as string);
    if (!roles.includes("admin") && !roles.includes("it_admin")) {
      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.displayName ? { full_name: data.displayName } : undefined,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");

    const newId = created.user.id;

    // Ensure profile (handle_new_user trigger normally creates it, but be defensive)
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: newId, email: data.email, display_name: data.displayName || data.email.split("@")[0] },
        { onConflict: "id" },
      );

    // Assign requested role (in addition to default 'normal' from trigger)
    if (data.role !== "normal") {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newId, role: data.role })
        .then(() => undefined, () => undefined);
    }

    return { id: newId, email: data.email };
  });
