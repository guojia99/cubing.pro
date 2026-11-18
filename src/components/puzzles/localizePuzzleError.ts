import type { Locale } from "@/i18n/locales";
import { translateWcaPuzzleExtra as extra, type WcaPuzzleExtraKey } from "@/i18n/messages/wca-puzzle-extra";

const exact: Record<string, WcaPuzzleExtraKey> = {
  "Only one native 2x2x2 player can be interactive at a time.": "wcaPuzzleExtra.busy",
  "Native 2x2x2 WebGL context lost. Retry to recover.": "wcaPuzzleExtra.contextLost",
  "WebGL context lost. Reopen the player to retry.": "wcaPuzzleExtra.contextLost",
  "WebGL context lost. Remount the player to retry.": "wcaPuzzleExtra.contextLost",
  "Native 2x2x2 scene is unavailable.": "wcaPuzzleExtra.sceneUnavailable",
  "Native 2x2x2 position API is unavailable.": "wcaPuzzleExtra.positionUnavailable",
  "Canvas screenshots are unavailable.": "wcaPuzzleExtra.screenshotUnavailable",
  "Native 2x2x2 screenshot is empty.": "wcaPuzzleExtra.screenshotEmpty",
  "3D player loading timed out.": "wcaPuzzleExtra.timeout",
  "Native 2x2x2 operation timed out. Retry to recover.": "wcaPuzzleExtra.timeout",
  "Puzzle face colors are unavailable.": "wcaPuzzleExtra.colorsUnavailable",
  "Formula is too long": "wcaPuzzleExtra.formulaLong",
  "Special diagram setup is too long": "wcaPuzzleExtra.formulaLong",
  "Formula repetition must be a safe integer": "wcaPuzzleExtra.safeInteger",
  "Formula move amount must be a safe integer": "wcaPuzzleExtra.safeInteger",
  "Illegal Square-1 slice": "wcaPuzzleExtra.illegalSlice",
  "No formula or setup available": "wcaPuzzleExtra.noSetup",
  "Unsupported cubing player lifecycle.": "wcaPuzzleExtra.playerUnavailable",
  "Unexpected cubing scene replacement.": "wcaPuzzleExtra.playerUnavailable",
  "Cube diagram requires six local #RRGGBB face colors (URFDLB)": "wcaPuzzleExtra.colorsUnavailable",
  "expected stopping": "wcaPuzzleExtra.syntax",
};

// Translate at the display boundary; raw diagnostics and player identity stay intact.
export function localizePuzzleError(text: string | undefined, locale: Locale): string {
  if (!text) return "";
  if (Object.hasOwn(exact, text)) return extra(locale, exact[text]);
  let match = /^Missing (?:native )?puzzle face: (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.missingFace", { face: match[1] });
  match = /^Invalid (.+) face color: (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.invalidColor", { face: match[1], color: match[2] });
  match = /^(?:Formula exceeds |Formula expansion exceeds |Library notation exceeds )(\d+)(?: moves\.?| leaves)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.moveLimit", { count: match[1] });
  match = /^Formula exceeds (\d+) nesting levels$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.nestingLimit", { count: match[1] });
  match = /^(?:Square-1 notation|Library notation) exceeds (\d+) characters$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.notationLong", { count: match[1] });
  match = /^Unsupported (\S+) (?:move|diagram action): (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.unsupportedMove", { puzzle: match[1], move: match[2] });
  match = /^Square-1 notation at character (\d+): /.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.squareNotation", { position: match[1] });
  if (/^Square-1 notation: unverified Angle annotation /.test(text)) return extra(locale, "wcaPuzzleExtra.angleInvalid");
  if (/: illegal slice \/ would split a corner\.$/.test(text)) return extra(locale, "wcaPuzzleExtra.illegalSlice");
  if (/^Unsupported fto library (?:setup|notation) at \d+: exceeds 4000 moves$/.test(text)) return extra(locale, "wcaPuzzleExtra.moveLimit", { count: 4000 });
  if (/^Unsupported fto library (?:setup|notation) at \d+: (?:CIF\/EIF regrips|malformed|impossible grip|unmatched)/.test(text)) return extra(locale, "wcaPuzzleExtra.syntax");
  match = /^Unsupported \S+ library (?:setup|notation)(?: at \d+)?: (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.notationInvalid", { detail: match[1] });
  match = /^Invalid move for KPuzzle \(([^)]+)\): (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.unsupportedMove", { puzzle: match[1], move: match[2] });
  match = /^Unexpected character: (.+)$/.exec(text);
  if (match) return extra(locale, "wcaPuzzleExtra.notationInvalid", { detail: match[1] });
  return text;
}
