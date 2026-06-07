import { cn } from "@/lib/utils";

const ENG_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
const SCO_FLAG = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";

// Regional indicator codepoints (U+1F1E6..U+1F1FF) encode an A..Z letter.
// Two of them in a row form a flag emoji whose letters spell the ISO-3166-1 alpha-2 code.
function emojiToIso2(emoji: string): string | null {
  if (emoji === ENG_FLAG) return "gb-eng";
  if (emoji === SCO_FLAG) return "gb-sct";
  const cps: number[] = [];
  for (const ch of emoji) cps.push(ch.codePointAt(0)!);
  if (cps.length !== 2) return null;
  const [a, b] = cps;
  if (a < 0x1f1e6 || a > 0x1f1ff || b < 0x1f1e6 || b > 0x1f1ff) return null;
  const letterA = String.fromCharCode(a - 0x1f1e6 + 65);
  const letterB = String.fromCharCode(b - 0x1f1e6 + 65);
  return (letterA + letterB).toLowerCase();
}

export function FlagIcon({
  emoji,
  className,
}: {
  emoji: string;
  className?: string;
}) {
  const iso = emojiToIso2(emoji);
  if (!iso) return <>{emoji}</>;
  return (
    <span
      className={cn("fi", `fi-${iso}`, "align-[-0.18em] rounded-[2px]", className)}
      aria-hidden
    />
  );
}
