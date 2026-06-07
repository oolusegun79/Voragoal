import { z } from "zod";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => s.trim())
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const optionalInt = (min: number, max: number) =>
  z
    .union([z.string().length(0), z.coerce.number().int().min(min).max(max)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : Number(v)));

export const teamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "Use a 2–4 letter code (e.g. USA)")
    .max(4)
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(2).max(80),
  shortName: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .transform((s) => s.toUpperCase()),
  flagEmoji: z.string().trim().min(1).max(12),
  accentColor: z.string().regex(HEX_COLOR, "Use a hex color like #1D9BF0"),
  groupCode: z
    .string()
    .trim()
    .max(2)
    .transform((s) => s.toUpperCase() || null)
    .nullable()
    .optional(),
  fifaRanking: optionalInt(1, 300),
  manager: optionalString(80),
});
export type TeamInput = z.infer<typeof teamSchema>;

export const playerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  knownAs: optionalString(80),
  teamId: z.string().trim().min(2),
  position: z.enum(["GK", "DF", "MF", "FW"]),
  shirtNumber: optionalInt(1, 99),
  club: optionalString(80),
  heightCm: optionalInt(140, 220),
});
export type PlayerInput = z.infer<typeof playerSchema>;

export const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "EDITOR", "ADMIN"]),
});
