import { it, expect } from "vitest";
import { freshProfile, createRun, tick, buyUpgrade } from "./model";
import type { Upgrade } from "./balance";
it("measures starter battle duration for simple strategies", () => {
  const reports = [];
  for (const strategy of ["none", "attack", "balanced"]) {
    const p = freshProfile(),
      r = createRun(p, 42);
    let next = 0;
    const keys: Upgrade[] =
      strategy === "attack"
        ? ["damage", "speed"]
        : ["damage", "speed", "health", "regen", "income", "range"];
    for (let i = 0; i < 36000 && r.status === "running"; i++) {
      tick(p, r);
      if (
        strategy !== "none" &&
        i % 30 === 0 &&
        buyUpgrade(p, r, keys[next % keys.length])
      )
        next++;
    }
    expect(r.status).toBe("dead");
    expect(r.time).toBeGreaterThan(10);
    reports.push({
      strategy,
      seconds: Math.round(r.time),
      wave: r.wave,
      coins: r.coins,
    });
  }
  console.log("Starter balance baseline:", JSON.stringify(reports));
});
