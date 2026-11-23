export const NICKNAME_FALLBACK = '"Kaiti SC", "KaiTi", "STKaiti", "Yu Mincho", "Noto Serif CJK SC", serif';
const NICKNAME_FONT = `"Player Card Long Cang", ${NICKNAME_FALLBACK}`;
let fontPromise: Promise<string> | undefined;

export function loadNicknameFont(): Promise<string> {
  return fontPromise ??= new FontFace(
    "Player Card Long Cang",
    'url("/fonts/player-card/long-cang.woff2") format("woff2")',
    { weight: "400", style: "normal" },
  ).load().then(face => {
    document.fonts.add(face);
    return NICKNAME_FONT;
  }, () => {
    // A failed bundled font still permits local rendering and PNG export.
    return NICKNAME_FALLBACK;
  });
}
