import { Fragment } from "react";

/**
 * Highlight all case-insensitive occurrences of `match` inside `text`.
 * Used by the header live search suggestions AND the full shop results page
 * so that the two experiences look consistent.
 */
export function Highlight({
  text,
  match,
  className = "rounded bg-primary/15 px-0.5 text-foreground",
}: {
  text: string;
  match: string;
  className?: string;
}) {
  const q = match.trim();
  if (!q) return <>{text}</>;
  const parts: Array<{ t: string; hit: boolean }> = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx < 0) {
      parts.push({ t: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ t: text.slice(i, idx), hit: false });
    parts.push({ t: text.slice(idx, idx + needle.length), hit: true });
    i = idx + needle.length;
  }
  return (
    <>
      {parts.map((p, k) => (
        <Fragment key={k}>
          {p.hit ? <mark className={className}>{p.t}</mark> : p.t}
        </Fragment>
      ))}
    </>
  );
}
