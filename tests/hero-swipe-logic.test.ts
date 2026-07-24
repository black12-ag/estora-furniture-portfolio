import { describe, it, expect, vi } from "vitest";

/**
 * Pure-function mirror of the swipe decision used in `HeroSlider`
 * (src/routes/index.tsx). Kept in sync via `tests/hero-images.test.ts`
 * which asserts the handler source still exists.
 *
 * Rules:
 *  - Threshold: |delta| must be > 50px to advance a slide.
 *  - delta < 0 → next(); delta > 0 → prev().
 *  - An interrupted gesture (pointercancel with active=false) is a no-op.
 *  - A gesture that never left the threshold band is a no-op.
 */
type SwipeDeps = { next: () => void; prev: () => void };
function decideSwipe(delta: number, deps: SwipeDeps) {
  if (Math.abs(delta) > 50) (delta < 0 ? deps.next : deps.prev)();
}

function makeState() {
  return {
    active: false,
    x: 0,
    dx: 0,
    paused: false,
    next: vi.fn(),
    prev: vi.fn(),
  };
}

function pointerDown(s: ReturnType<typeof makeState>, x: number) {
  s.active = true;
  s.x = x;
  s.paused = true;
}
function pointerMove(s: ReturnType<typeof makeState>, x: number, reducedMotion = false) {
  if (!s.active) return;
  if (!reducedMotion) s.dx = x - s.x;
}
function pointerEnd(s: ReturnType<typeof makeState>, x: number) {
  if (!s.active) return;
  const delta = x - s.x;
  s.active = false;
  s.dx = 0;
  s.paused = false;
  decideSwipe(delta, s);
}
function pointerCancel(s: ReturnType<typeof makeState>) {
  s.active = false;
  s.dx = 0;
  s.paused = false;
}

describe("HeroSlider swipe gesture logic (touch/pointer)", () => {
  it("quick left swipe past threshold advances to next slide", () => {
    const s = makeState();
    pointerDown(s, 200);
    pointerMove(s, 150);
    pointerMove(s, 100);
    pointerEnd(s, 120); // delta = -80
    expect(s.next).toHaveBeenCalledTimes(1);
    expect(s.prev).not.toHaveBeenCalled();
  });

  it("quick right swipe past threshold goes to previous slide", () => {
    const s = makeState();
    pointerDown(s, 100);
    pointerEnd(s, 200); // delta = +100
    expect(s.prev).toHaveBeenCalledTimes(1);
    expect(s.next).not.toHaveBeenCalled();
  });

  it("small drag below 50px threshold does not change slide", () => {
    const s = makeState();
    pointerDown(s, 100);
    pointerMove(s, 130);
    pointerEnd(s, 140); // delta = +40
    expect(s.next).not.toHaveBeenCalled();
    expect(s.prev).not.toHaveBeenCalled();
  });

  it("exactly threshold (50px) does not advance (strict >)", () => {
    const s = makeState();
    pointerDown(s, 0);
    pointerEnd(s, 50);
    expect(s.next).not.toHaveBeenCalled();
    expect(s.prev).not.toHaveBeenCalled();
  });

  it("interrupted gesture (pointercancel) does not advance", () => {
    const s = makeState();
    pointerDown(s, 0);
    pointerMove(s, -200);
    pointerCancel(s);
    // subsequent pointerup after cancel is a no-op
    pointerEnd(s, -300);
    expect(s.next).not.toHaveBeenCalled();
    expect(s.prev).not.toHaveBeenCalled();
    expect(s.active).toBe(false);
    expect(s.dx).toBe(0);
    expect(s.paused).toBe(false);
  });

  it("pointerup without prior pointerdown is ignored", () => {
    const s = makeState();
    pointerEnd(s, 999);
    expect(s.next).not.toHaveBeenCalled();
    expect(s.prev).not.toHaveBeenCalled();
  });

  it("reduced-motion suppresses live translate but still advances on release", () => {
    const s = makeState();
    pointerDown(s, 0);
    pointerMove(s, -120, /* reducedMotion */ true);
    expect(s.dx).toBe(0); // no live follow
    pointerEnd(s, -120);
    expect(s.next).toHaveBeenCalledTimes(1);
  });

  it("resumes autoplay (paused=false) after gesture ends regardless of outcome", () => {
    const s = makeState();
    pointerDown(s, 0);
    expect(s.paused).toBe(true);
    pointerEnd(s, 10);
    expect(s.paused).toBe(false);
  });
});
