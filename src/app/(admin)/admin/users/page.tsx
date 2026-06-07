import { Trash2 } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { updateRoleAction, deleteUserAction } from "./actions";

const ROLES = ["USER", "EDITOR", "ADMIN"] as const;

export default async function AdminUsersPage() {
  const me = await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { favoriteTeams: true, favoritePlayers: true, savedMatches: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} account{users.length === 1 ? "" : "s"}. You are signed in as <span className="text-accent">{me.email}</span>.
        </p>
      </header>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60 bg-card-muted/40">
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Role</th>
              <th className="px-4 py-2 text-right font-medium">Favorites</th>
              <th className="px-4 py-2 text-right font-medium">Saved</th>
              <th className="px-4 py-2 text-right font-medium">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-4 py-2">
                    <div className="font-medium">{u.email}</div>
                    {isMe ? <div className="text-xs text-accent">you</div> : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{u.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <form action={updateRoleAction} className="inline-flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="h-8 rounded-md border border-border/80 bg-background px-2 text-xs"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-md bg-card-muted px-2 text-xs hover:bg-card"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {u._count.favoriteTeams + u._count.favoritePlayers}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {u._count.savedMatches}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {isMe ? null : (
                      <form action={deleteUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          aria-label={`Delete ${u.email}`}
                          className="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        EDITOR can manage teams, players, matches, and events. ADMIN can additionally promote users and delete accounts.
      </p>
    </div>
  );
}
