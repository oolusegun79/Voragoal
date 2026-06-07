"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Team } from "@prisma/client";
import { createTeamAction, updateTeamAction } from "@/app/(admin)/admin/teams/actions";

const GROUPS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export function TeamForm({ existing }: { existing?: Team }) {
  const action = existing ? updateTeamAction : createTeamAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Code (ISO-3)" hint="USA, MEX, BRA…">
          <input
            name="id"
            type="text"
            required
            maxLength={4}
            defaultValue={existing?.id ?? ""}
            readOnly={Boolean(existing)}
            className={input + (existing ? " bg-card-muted" : "")}
            placeholder="USA"
          />
        </Field>
        <Field label="Flag emoji">
          <input
            name="flagEmoji"
            type="text"
            required
            maxLength={12}
            defaultValue={existing?.flagEmoji ?? ""}
            className={input}
            placeholder="🇺🇸"
          />
        </Field>
      </div>

      <Field label="Name">
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={existing?.name ?? ""}
          className={input}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Short name">
          <input
            name="shortName"
            type="text"
            required
            maxLength={6}
            defaultValue={existing?.shortName ?? ""}
            className={input}
          />
        </Field>
        <Field label="Accent color (hex)">
          <input
            name="accentColor"
            type="text"
            required
            pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
            defaultValue={existing?.accentColor ?? "#1D9BF0"}
            className={input}
            placeholder="#1D9BF0"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Group">
          <select
            name="groupCode"
            defaultValue={existing?.groupCode ?? ""}
            className={input}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g || "—"}</option>
            ))}
          </select>
        </Field>
        <Field label="FIFA ranking">
          <input
            name="fifaRanking"
            type="number"
            min={1}
            max={300}
            defaultValue={existing?.fifaRanking ?? ""}
            className={input}
          />
        </Field>
        <Field label="Coach / manager">
          <input
            name="manager"
            type="text"
            maxLength={80}
            defaultValue={existing?.manager ?? ""}
            className={input}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Link
          href="/admin/teams"
          className="inline-flex h-9 items-center rounded-md border border-border/80 bg-card/40 px-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : existing ? "Save changes" : "Create team"}
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
