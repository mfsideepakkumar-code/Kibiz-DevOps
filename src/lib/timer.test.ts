import { describe, expect, it } from "vitest";

import { computeTimerSegments, formatElapsed } from "./timer";

describe("computeTimerSegments", () => {
  it("same-day span → one segment", () => {
    const { segments, autoStopped } = computeTimerSegments(
      new Date("2026-06-14T10:00:00Z"),
      new Date("2026-06-14T11:30:00Z"),
    );
    expect(autoStopped).toBe(false);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ workDate: "2026-06-14", minutes: 90 });
  });

  it("span crossing midnight → one entry per day", () => {
    const { segments } = computeTimerSegments(
      new Date("2026-06-14T23:30:00Z"),
      new Date("2026-06-15T01:15:00Z"),
    );
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ workDate: "2026-06-14", minutes: 30 });
    expect(segments[1]).toMatchObject({ workDate: "2026-06-15", minutes: 75 });
  });

  it("caps a span over 12h and flags auto-stop", () => {
    const { segments, autoStopped } = computeTimerSegments(
      new Date("2026-06-14T08:00:00Z"),
      new Date("2026-06-14T22:00:00Z"), // 14h
    );
    expect(autoStopped).toBe(true);
    const total = segments.reduce((n, s) => n + s.minutes, 0);
    expect(total).toBe(12 * 60);
  });

  it("discards a span under one minute", () => {
    const { segments } = computeTimerSegments(
      new Date("2026-06-14T10:00:00Z"),
      new Date("2026-06-14T10:00:30Z"),
    );
    expect(segments).toHaveLength(0);
  });

  it("returns nothing for a non-positive span", () => {
    const { segments } = computeTimerSegments(
      new Date("2026-06-14T10:00:00Z"),
      new Date("2026-06-14T09:00:00Z"),
    );
    expect(segments).toHaveLength(0);
  });
});

describe("formatElapsed", () => {
  it("formats hh:mm:ss with zero padding", () => {
    expect(formatElapsed(4522)).toBe("01:15:22");
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(90)).toBe("00:01:30");
  });

  it("allows hours beyond 24", () => {
    expect(formatElapsed(25 * 3600)).toBe("25:00:00");
  });
});
