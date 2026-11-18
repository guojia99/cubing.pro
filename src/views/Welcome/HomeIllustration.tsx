export function HomeIllustration({ variant }: { variant: "cube" | "draw" | "competition" }) {
  return (
    <svg viewBox="0 0 96 80" fill="none" aria-hidden="true" focusable="false">
      {variant === "competition" ? <>
        <path d="M29 14h38v18c0 14-8 23-19 23S29 46 29 32V14Z" fill="var(--accent-soft)" stroke="currentColor" strokeWidth="3" />
        <path d="M29 20H18v9c0 9 6 14 15 14m34-23h11v9c0 9-6 14-15 14M48 55v12m-14 0h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="m48 23 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" fill="currentColor" />
      </> : <>
        <path d="m48 7 32 18v34L48 77 16 59V25L48 7Z" fill="var(--accent-soft)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="m16 25 32 18 32-18M48 43v34M27 19l32 18v34M37 13l32 18v34M27 31v34m10-28v34M16 36l32 18 32-18M16 47l32 18 32-18M27 19l32 18m-22-24 32 18M27 31l32-18m-22 24 32-18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity=".7" />
        {variant === "draw" ? <path d="m67 58 16-25 7 5-16 25-10 6 3-11Z" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /> : null}
      </>}
    </svg>
  );
}
