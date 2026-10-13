import {
  CENTER,
  STEP,
  WAVE_SECONDS,
  MAX_ENEMIES,
  UPGRADE_KEYS,
  UPGRADES,
  cost,
  metaCost,
  type Upgrade,
  type MetaUpgrade,
} from "./balance";
export interface Profile {
  version: 1;
  coins: number;
  bestWave: number;
  runs: number;
  upgrades: Record<MetaUpgrade, number>;
}
export type EnemyKind = "basic" | "fast" | "tank" | "boss";
export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackTimer: number;
  radius: number;
}
export interface Shot {
  x: number;
  y: number;
  targetId: number;
  damage: number;
}
export interface Run {
  seed: number;
  rng: number;
  wave: number;
  time: number;
  waveTime: number;
  spawnTimer: number;
  shotTimer: number;
  cash: number;
  coins: number;
  hp: number;
  kills: number;
  status: "running" | "dead";
  settled: boolean;
  levels: Record<Upgrade, number>;
  enemies: Enemy[];
  shots: Shot[];
  nextId: number;
}
export const freshProfile = (): Profile => ({
  version: 1,
  coins: 0,
  bestWave: 0,
  runs: 0,
  upgrades: { damage: 0, health: 0, income: 0 },
});
export function stats(p: Profile, r: Run) {
  return {
    damage: 10 + p.upgrades.damage * 2 + r.levels.damage * 3,
    attacks: 1.2 + r.levels.speed * 0.15,
    maxHp: 100 + p.upgrades.health * 10 + r.levels.health * 20,
    regen: r.levels.regen * 0.4,
    range: 110 + r.levels.range * 4,
    income: 1 + p.upgrades.income * 0.08 + r.levels.income * 0.15,
  };
}
export function createRun(p: Profile, seed: number): Run {
  return {
    seed: seed >>> 0,
    rng: seed >>> 0 || 1,
    wave: 1,
    time: 0,
    waveTime: 0,
    spawnTimer: 0,
    shotTimer: 0,
    cash: 30,
    coins: 0,
    hp: 100 + p.upgrades.health * 10,
    kills: 0,
    status: "running",
    settled: false,
    levels: Object.fromEntries(UPGRADE_KEYS.map((k) => [k, 0])) as Record<
      Upgrade,
      number
    >,
    enemies: [],
    shots: [],
    nextId: 1,
  };
}
function random(r: Run) {
  r.rng = (Math.imul(1664525, r.rng) + 1013904223) >>> 0;
  return r.rng / 4294967296;
}
function spawn(r: Run, kind: EnemyKind) {
  const angle = random(r) * Math.PI * 2;
  const modifiers = {
    basic: [1, 1, 1, 5],
    fast: [0.55, 1.7, 0.7, 4],
    tank: [2.5, 0.65, 1.4, 7],
    boss: [9, 0.55, 3, 12],
  }[kind];
  const hp = (12 + 4 * r.wave) * 1.055 ** (r.wave - 1) * modifiers[0];
  r.enemies.push({
    id: r.nextId++,
    kind,
    x: CENTER + 192 * Math.cos(angle),
    y: CENTER + 192 * Math.sin(angle),
    hp,
    maxHp: hp,
    speed: (11 + r.wave * 0.32) * modifiers[1],
    damage: (3 + r.wave * 0.65) * modifiers[2],
    attackTimer: 0,
    radius: modifiers[3],
  });
}
export function buyUpgrade(p: Profile, r: Run, key: Upgrade): boolean {
  const price = cost(key, r.levels[key]);
  if (
    r.status !== "running" ||
    r.levels[key] >= UPGRADES[key].cap ||
    r.cash < price
  )
    return false;
  r.cash -= price;
  r.levels[key]++;
  if (key === "health") r.hp += 20;
  return true;
}
export function buyMeta(p: Profile, key: MetaUpgrade): boolean {
  const level = p.upgrades[key];
  if (level >= 50) return false;
  const price = metaCost(level);
  if (p.coins < price) return false;
  p.coins -= price;
  p.upgrades[key]++;
  return true;
}
// Fixed 30 Hz simulation, independent of rendering.
export function tick(p: Profile, r: Run, dt = STEP): void {
  if (r.status !== "running") return;
  const s = stats(p, r);
  r.time += dt;
  r.waveTime += dt;
  r.spawnTimer -= dt;
  r.shotTimer -= dt;
  if (r.waveTime >= WAVE_SECONDS) {
    r.waveTime -= WAVE_SECONDS;
    r.wave++;
    if (r.wave % 10 === 0 && r.enemies.length < MAX_ENEMIES) spawn(r, "boss");
  }
  if (r.spawnTimer <= 0 && r.enemies.length < MAX_ENEMIES) {
    const roll = random(r);
    spawn(
      r,
      r.wave >= 3 && roll < 0.2
        ? "fast"
        : r.wave >= 5 && roll > 0.8
          ? "tank"
          : "basic",
    );
    r.spawnTimer += Math.max(0.23, 1.7 - r.wave * 0.025);
  }
  r.hp = Math.min(s.maxHp, r.hp + s.regen * dt);
  for (const e of r.enemies) {
    const dx = CENTER - e.x,
      dy = CENTER - e.y,
      d = Math.hypot(dx, dy);
    if (d > 15 + e.radius) {
      const move = Math.min(e.speed * dt, d - 15 - e.radius);
      e.x += (dx / d) * move;
      e.y += (dy / d) * move;
    } else {
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        r.hp -= e.damage;
        e.attackTimer += 1;
      }
    }
  }
  if (r.hp <= 0) {
    r.hp = 0;
    r.status = "dead";
    return;
  }
  if (r.shotTimer <= 0) {
    let target: Enemy | undefined;
    let nearest = s.range;
    for (const e of r.enemies) {
      const d = Math.hypot(e.x - CENTER, e.y - CENTER);
      if (e.hp > 0 && d <= nearest) {
        target = e;
        nearest = d;
      }
    }
    if (target) {
      r.shots.push({
        x: CENTER,
        y: CENTER,
        targetId: target.id,
        damage: s.damage,
      });
      r.shotTimer += 1 / s.attacks;
    } else r.shotTimer = 0;
  }
  const remaining: Shot[] = [];
  for (const shot of r.shots) {
    const e = r.enemies.find((e) => e.id === shot.targetId && e.hp > 0);
    if (!e) continue;
    const dx = e.x - shot.x,
      dy = e.y - shot.y,
      d = Math.hypot(dx, dy),
      move = 260 * dt;
    if (d <= move + e.radius) {
      e.hp -= shot.damage;
      if (e.hp <= 0) {
        r.kills++;
        r.cash += Math.round((e.kind === "boss" ? 25 : 5) * s.income);
        r.coins += e.kind === "boss" ? 5 : 1;
      }
    } else {
      shot.x += (dx / d) * move;
      shot.y += (dy / d) * move;
      remaining.push(shot);
    }
  }
  r.shots = remaining;
  r.enemies = r.enemies.filter((e) => e.hp > 0);
}
export function settle(p: Profile, r: Run): Profile {
  if (r.status !== "dead") throw new Error("Cannot settle a live run");
  if (r.settled) throw new Error("Run already settled");
  r.settled = true;
  return {
    ...p,
    upgrades: { ...p.upgrades },
    coins: p.coins + r.coins,
    bestWave: Math.max(p.bestWave, r.wave),
    runs: p.runs + 1,
  };
}
