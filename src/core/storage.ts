import { freshProfile, type Profile, type Run } from "./model";
import { META_KEYS, UPGRADE_KEYS, UPGRADES, MAX_ENEMIES } from "./balance";
const KEY = "core-tower-session-v1";
const BACKUP = KEY + "-backup";
export interface Session {
  version: 1;
  profile: Profile;
  run: Run | null;
}
function record(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function finite(v: unknown, min = 0, max = 1e15): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
function integer(
  v: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): v is number {
  return finite(v, min, max) && Number.isInteger(v);
}
function validProfile(o: unknown): o is Profile {
  if (
    !record(o) ||
    o.version !== 1 ||
    !integer(o.coins) ||
    !integer(o.bestWave, 0, 10000) ||
    !integer(o.runs) ||
    !record(o.upgrades)
  )
    return false;
  const u = o.upgrades;
  return META_KEYS.every((k) => integer(u[k], 0, 50));
}
function validRun(o: unknown): o is Run {
  if (
    !record(o) ||
    o.status !== "running" ||
    o.settled !== false ||
    !record(o.levels)
  )
    return false;
  const levels = o.levels;
  if (!UPGRADE_KEYS.every((k) => integer(levels[k], 0, UPGRADES[k].cap)))
    return false;
  if (
    !integer(o.seed, 0, 0xffffffff) ||
    !integer(o.rng, 0, 0xffffffff) ||
    !integer(o.wave, 1, 10000) ||
    !integer(o.nextId, 1) ||
    !integer(o.kills) ||
    !integer(o.coins) ||
    !integer(o.cash)
  )
    return false;
  if (
    !["time", "waveTime", "hp"].every((k) => finite(o[k])) ||
    !finite(o.spawnTimer, -1, 10) ||
    !finite(o.shotTimer, -1, 10)
  )
    return false;
  if (
    !Array.isArray(o.enemies) ||
    o.enemies.length > MAX_ENEMIES ||
    !Array.isArray(o.shots) ||
    o.shots.length > 500
  )
    return false;
  const ids = new Set<number>();
  for (const e of o.enemies) {
    if (
      !record(e) ||
      !integer(e.id, 1) ||
      ids.has(e.id) ||
      e.id >= (o.nextId as number) ||
      !["basic", "fast", "tank", "boss"].includes(String(e.kind))
    )
      return false;
    if (
      !["x", "y"].every((k) => finite(e[k], -20, 420)) ||
      !["hp", "maxHp", "speed", "damage", "radius"].every((k) =>
        finite(e[k]),
      ) ||
      !finite(e.attackTimer, -1, 2)
    )
      return false;
    if ((e.hp as number) > (e.maxHp as number) || (e.hp as number) <= 0)
      return false;
    ids.add(e.id);
  }
  for (const shot of o.shots) {
    if (
      !record(shot) ||
      !integer(shot.targetId, 1) ||
      !["x", "y"].every((k) => finite(shot[k], -20, 420)) ||
      !finite(shot.damage)
    )
      return false;
  }
  return true;
}
export function parseSession(raw: string | null): Session | null {
  try {
    const o: unknown = JSON.parse(raw ?? "null");
    if (
      !record(o) ||
      o.version !== 1 ||
      !validProfile(o.profile) ||
      (o.run !== null && !validRun(o.run))
    )
      return null;
    return { version: 1, profile: o.profile, run: o.run };
  } catch {
    return null;
  }
}
export function loadSession(): Session {
  try {
    return (
      parseSession(localStorage.getItem(KEY)) ??
      parseSession(localStorage.getItem(BACKUP)) ?? {
        version: 1,
        profile: freshProfile(),
        run: null,
      }
    );
  } catch {
    return { version: 1, profile: freshProfile(), run: null };
  }
}
// Store profile and run together: reward and run completion cannot be saved separately.
export function saveSession(profile: Profile, run: Run | null): boolean {
  try {
    const old = localStorage.getItem(KEY);
    if (parseSession(old)) localStorage.setItem(BACKUP, old!);
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        profile,
        run: run?.status === "running" ? run : null,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
