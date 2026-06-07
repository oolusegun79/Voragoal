"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Player, Team } from "@prisma/client";
import { createPlayerAction, updatePlayerAction } from "@/app/(admin)/admin/players/actions";

const POSITIONS = ["GK", "DF", "MF", "FW"] as const;

export function PlayerForm({
  teams,
  existing,
  defaultTeamId,
}: {
  teams: Team[];
  existing?: Player;
  defaultTeamId?: string;
}) {
  const action = existing ? updatePlayerAction : createPlayerAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {existing ? <input type="hidden" name="id" value={existing.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Saved.
        </p>
      ) : null}

      <Field label="Full name">
        <input
          name="fullName"
          type="text"
          required
          maxLength={120}
          defaultValue={existing?.fullName ?? ""}
          className={input}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Known as" hint="Display name on cards (optional)">
          <input
            name="knownAs"
            type="text"
            maxLength={80}
            defaultValue={existing?.knownAs ?? ""}
            className={input}
          />
        </Field>
        <Field label="Team">
          <select
            name="teamId"
            required
            defaultValue={existing?.teamId ?? defaultTeamId ?? ""}
            className={input}
          >
            <option value="">Select team…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flagEmoji} {t.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Position">
          <select
            name="position"
            required
            defaultValue={existing?.position ?? "MF"}
            className={input}
          >
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Shirt #">
          <input
            name="shirtNumber"
            type="number"
            min={1}
            max={99}
            defaultValue={existing?.shirtNumber ?? ""}
            className={input}
          />
        </Field>
        <Field label="Height (cm)">
          <input
            name="heightCm"
            type="number"
            min={140}
            max={220}
            defaultValue={existing?.heightCm ?? ""}
            className={input}
          />
        </Field>
      </div>

      <Field label="Club">
        <input
          name="club"
          type="text"
          maxLength={80}
          defaultValue={existing?.club ?? ""}
          className={input}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/players"
          className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/40 px-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : existing ? "Save changes" : "Add player"}
        </button>
      </div>
    </form>
  );
}

const input =
  "block h-9 w-full rounded-md border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}
