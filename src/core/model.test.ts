import { describe, it, expect } from "vitest";
import { STEP } from "./balance";
import {
  freshProfile,
  createRun,
  tick,
  buyUpgrade,
  buyMeta,
  settle,
  stats,
  type Run,
} from "./model";
import { parseSession } from "./storage";
function simulate(seed: number) {
  const p = freshProfile(),
    r = createRun(p, seed);
  for (let i = 0; i < 18000 && r.status === "running"; i++) tick(p, r);
  return r;
}
describe("combat and progression", () => {
  it("produces the same battle with the same seed", () => {
    expect(simulate(42)).toEqual(simulate(42));
    expect(simulate(42).status).toBe("dead");
  });
  it("never buys unaffordable upgrades or debits the wallet on failure", () => {
    const p = freshProfile(),
      r = createRun(p, 1);
    r.cash = 0;
    expect(buyUpgrade(p, r, "damage")).toBe(false);
    expect(r.levels.damage).toBe(0);
    expect(r.cash).toBe(0);
  });
  it("resets run upgrades while preserving permanent upgrades", () => {
    const p = freshProfile();
    p.coins = 100;
    expect(buyMeta(p, "damage")).toBe(true);
    const r = createRun(p, 2);
    expect(buyUpgrade(p, r, "damage")).toBe(true);
    expect(stats(p, r).damage).toBe(15);
    const next = createRun(p, 3);
    expect(next.levels.damage).toBe(0);
    expect(stats(p, next).damage).toBe(12);
  });
  it("grants a killed enemy reward exactly once even with multiple projectiles", () => {
    const p = freshProfile(),
      r = createRun(p, 1);
    r.spawnTimer = 9;
    r.shotTimer = 9;
    r.enemies = [
      {
        id: 1,
        kind: "basic",
        x: 200,
        y: 200,
        hp: 5,
        maxHp: 5,
        speed: 0,
        damage: 0,
        attackTimer: 1,
        radius: 5,
      },
    ];
    r.nextId = 2;
    r.shots = [
      { x: 200, y: 200, targetId: 1, damage: 10 },
      { x: 200, y: 200, targetId: 1, damage: 10 },
    ];
    tick(p, r);
    expect(r.kills).toBe(1);
    expect(r.coins).toBe(1);
    expect(r.cash).toBe(35);
  });
  it("settles only dead runs and rejects duplicate settlement", () => {
    const p = freshProfile(),
      r = createRun(p, 5);
    expect(() => settle(p, r)).toThrow();
    r.status = "dead";
    r.coins = 20;
    const next = settle(p, r);
    expect(next.coins).toBe(20);
    expect(next.runs).toBe(1);
    expect(() => settle(next, r)).toThrow("already settled");
  });
  it("allows a snapshot to resume identically to uninterrupted simulation", () => {
    const p = freshProfile(),
      r = createRun(p, 123);
    for (let i = 0; i < 150; i++) tick(p, r);
    const saved = parseSession(
      JSON.stringify({ version: 1, profile: p, run: r }),
    );
    expect(saved).not.toBeNull();
    const restored = saved!.run!;
    for (let i = 0; i < 900; i++) {
      tick(p, r);
      tick(saved!.profile, restored);
    }
    expect(restored).toEqual(r);
  });
  it("stops time and rewards after death", () => {
    const p = freshProfile(),
      r = simulate(99);
    const before = structuredClone(r);
    tick(p, r);
    expect(r).toEqual(before);
  });
  it("spawns a boss on wave ten", () => {
    const p = freshProfile(),
      r = createRun(p, 1);
    r.wave = 9;
    r.waveTime = 9 - STEP / 2;
    r.spawnTimer = 9;
    r.shotTimer = 9;
    tick(p, r);
    expect(r.wave).toBe(10);
    expect(r.enemies.some((e) => e.kind === "boss")).toBe(true);
  });
});
describe("save validation", () => {
  it("rejects malformed, unsupported and invalid data", () => {
    expect(parseSession("{")).toBeNull();
    expect(
      parseSession(
        JSON.stringify({ version: 2, profile: freshProfile(), run: null }),
      ),
    ).toBeNull();
    const p = freshProfile();
    p.coins = -1;
    expect(
      parseSession(JSON.stringify({ version: 1, profile: p, run: null })),
    ).toBeNull();
  });
  it("rejects corrupt enemies and upgrade levels", () => {
    const p = freshProfile(),
      r = createRun(p, 1);
    r.levels.range = 900;
    expect(
      parseSession(JSON.stringify({ version: 1, profile: p, run: r })),
    ).toBeNull();
  });
  it("accepts a valid completed profile without a live run", () => {
    const p = freshProfile();
    p.coins = 25;
    expect(
      parseSession(JSON.stringify({ version: 1, profile: p, run: null })),
    ).toEqual({ version: 1, profile: p, run: null });
  });
});
