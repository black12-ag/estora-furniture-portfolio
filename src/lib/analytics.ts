// Lightweight client-side analytics helper.
// Pushes events to window.dataLayer (GA4/GTM friendly) and dispatches
// a CustomEvent("estora:track") so tests and other listeners can observe.
export type TrackProps = Record<string, string | number | boolean | undefined>;

export function track(event: string, props: TrackProps = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...props, ts: Date.now() };
  // GA4 / GTM dataLayer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
  try {
    window.dispatchEvent(new CustomEvent("estora:track", { detail: payload }));
  } catch {
    /* ignore */
  }
}
