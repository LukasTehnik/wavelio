export const STEP = 1 / 30;
export const WORLD = 400;
export const CENTER = WORLD / 2;
export const UPGRADE_KEYS = [
  "damage",
  "speed",
  "health",
  "regen",
  "range",
  "income",
] as const;
export type Upgrade = (typeof UPGRADE_KEYS)[number];
export const UPGRADES: Record<
  Upgrade,
  { label: string; description: string; baseCost: number; cap: number }
> = {
  damage: {
    label: "Poškození",
    description: "+3 poškození na zásah",
    baseCost: 12,
    cap: 60,
  },
  speed: {
    label: "Rychlost střelby",
    description: "+0,15 útoku za sekundu",
    baseCost: 18,
    cap: 40,
  },
  health: {
    label: "Maximum HP",
    description: "+20 maximálních i aktuálních HP",
    baseCost: 14,
    cap: 80,
  },
  regen: {
    label: "Regenerace",
    description: "+0,4 HP za sekundu",
    baseCost: 22,
    cap: 30,
  },
  range: {
    label: "Dosah",
    description: "+4 jednotky dosahu",
    baseCost: 20,
    cap: 15,
  },
  income: {
    label: "Příjem",
    description: "+15 % cash z nepřátel",
    baseCost: 25,
    cap: 40,
  },
};
export const META_KEYS = ["damage", "health", "income"] as const;
export type MetaUpgrade = (typeof META_KEYS)[number];
export const WAVE_SECONDS = 9;
export const MAX_ENEMIES = 160;
export function cost(key: Upgrade, level: number): number {
  return Math.ceil(UPGRADES[key].baseCost * 1.27 ** level);
}
export function metaCost(level: number): number {
  return Math.ceil(8 * 1.6 ** level);
}
