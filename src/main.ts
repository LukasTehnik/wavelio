import Phaser from "phaser";
import "./style.css";
import {
  STEP,
  WORLD,
  UPGRADE_KEYS,
  META_KEYS,
  UPGRADES,
  cost,
  metaCost,
  type Upgrade,
  type MetaUpgrade,
} from "./core/balance";
import {
  createRun,
  stats,
  tick,
  buyUpgrade,
  buyMeta,
  settle,
  type Run,
} from "./core/model";
import { loadSession, saveSession } from "./core/storage";
import { Arena } from "./view/Arena";
const loaded = loadSession();
let profile = loaded.profile,
  run: Run | null = loaded.run,
  paused = !!run,
  speed = 1,
  accumulator = 0,
  last = performance.now(),
  uiTimer = 0,
  saveTimer = 0;
let saveWarning = false;
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main><header><div><small>AUTONOMOUS DEFENSE / 0.1</small><h1>CORE<span> / TOWER</span></h1></div><span id="record"></span></header>
<section class="play"><div id="arena"></div><div class="overlay" id="overlay"><h2>Chraň jádro.</h2><p>Automatický boj. Ty rozhoduješ o investicích.</p><button id="start">Spustit výpravu →</button></div></section>
<section class="telemetry"><span>VLNA <b id="wave">—</b></span><span>CASH <b id="cash">—</b></span><span>KOŘIST <b id="loot">—</b></span><span>ČAS <b id="time">—</b></span></section>
<div class="health"><div id="hpbar"></div><span id="hp">Připraveno</span></div>
<div class="controls"><button id="pause" disabled>Pauza</button><button id="speed">Rychlost 1×</button><span id="status">Zvol první investici ve workshopu.</span></div>
<nav><button class="active" data-tab="battle">Bojové upgrady</button><button data-tab="workshop">Trvalý workshop</button></nav>
<section id="battle" class="panel"><div class="hint">Platí jen v tomto běhu. Nový běh začíná bez těchto úrovní.</div><div class="cards">${UPGRADE_KEYS.map((k) => `<button class="card" data-upgrade="${k}"><span>${UPGRADES[k].label}<b id="level-${k}">0</b></span><small>${UPGRADES[k].description}</small><strong id="price-${k}"></strong></button>`).join("")}</div></section>
<section id="workshop" class="panel" hidden><div class="hint">Trvalé mince: <b id="bank">0</b>. Nakupovat lze mezi běhy.</div><div class="cards">${META_KEYS.map((k) => `<button class="card" data-meta="${k}"><span>${UPGRADES[k].label}<b id="meta-level-${k}">0</b></span><small>${{ damage: "+2 základní poškození", health: "+10 základních HP", income: "+8 % základní cash příjem" }[k]}</small><strong id="meta-price-${k}"></strong></button>`).join("")}</div></section>
<footer>PROTOTYP / Lokální postup · Rozehraný běh se ukládá.<p id="save-warning" hidden>Uložení selhalo. Postup nyní existuje jen v paměti.</p></footer></main>`;
const $ = (id: string) => document.getElementById(id)!;
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "arena",
  width: WORLD,
  height: WORLD,
  backgroundColor: "#101512",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new Arena(() => ({ profile, run }))],
  banner: false,
});
function persist() {
  saveWarning = !saveSession(profile, run);
  $("save-warning").hidden = !saveWarning;
}
function render() {
  $("record").textContent = `REKORD / ${profile.bestWave}`;
  $("bank").textContent = String(profile.coins);
  const live = run?.status === "running";
  ($("pause") as HTMLButtonElement).disabled = !live;
  $("pause").textContent = paused ? "Pokračovat" : "Pauza";
  $("speed").textContent = `Rychlost ${speed}×`;
  $("wave").textContent = run ? String(run.wave) : "—";
  $("cash").textContent = run ? String(run.cash) : "—";
  $("loot").textContent = run ? String(run.coins) : "—";
  $("time").textContent = run
    ? `${Math.floor(run.time / 60)}:${String(Math.floor(run.time % 60)).padStart(2, "0")}`
    : "—";
  if (run) {
    const s = stats(profile, run);
    $("hp").textContent = `${Math.ceil(run.hp)} / ${s.maxHp} HP`;
    $("hpbar").style.width = `${(run.hp / s.maxHp) * 100}%`;
  }
  $("status").textContent = live
    ? paused
      ? "Boj pozastaven"
      : `Zásah ${stats(profile, run!).damage} · ${stats(profile, run!).attacks.toFixed(2)} útoku/s`
    : "Workshop je připraven.";
  for (const key of UPGRADE_KEYS) {
    const l = run?.levels[key] ?? 0,
      price = cost(key, l),
      max = l >= UPGRADES[key].cap;
    $("level-" + key).textContent = String(l);
    $("price-" + key).textContent = max ? "MAX" : `${price} cash`;
    (
      document.querySelector(`[data-upgrade="${key}"]`) as HTMLButtonElement
    ).disabled = !live || max || run!.cash < price;
  }
  for (const key of META_KEYS) {
    const l = profile.upgrades[key],
      max = l >= 50;
    $("meta-level-" + key).textContent = String(l);
    $("meta-price-" + key).textContent = max ? "MAX" : `${metaCost(l)} mincí`;
    (
      document.querySelector(`[data-meta="${key}"]`) as HTMLButtonElement
    ).disabled = !!live || max || profile.coins < metaCost(l);
  }
}
function start() {
  run = createRun(profile, crypto.getRandomValues(new Uint32Array(1))[0]);
  paused = false;
  accumulator = 0;
  $("overlay").hidden = true;
  persist();
  render();
}
function finish() {
  profile = settle(profile, run!);
  persist();
  $("overlay").innerHTML =
    `<h2>Jádro zničeno.</h2><p>Vlna ${run!.wave} · ${run!.kills} poražených</p><p>+${run!.coins} trvalých mincí</p><button id="restart">Další výprava →</button>`;
  $("overlay").hidden = false;
  $("restart").addEventListener("click", start);
  render();
}
$("start").addEventListener("click", start);
$("pause").addEventListener("click", () => {
  paused = !paused;
  accumulator = 0;
  persist();
  render();
});
$("speed").addEventListener("click", () => {
  speed = speed === 1 ? 2 : 1;
  render();
});
app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button",
  );
  if (!target) return;
  if (
    target.dataset.upgrade &&
    run &&
    buyUpgrade(profile, run, target.dataset.upgrade as Upgrade)
  ) {
    persist();
    render();
  }
  if (
    target.dataset.meta &&
    run?.status !== "running" &&
    buyMeta(profile, target.dataset.meta as MetaUpgrade)
  ) {
    persist();
    render();
  }
  if (target.dataset.tab) {
    for (const name of ["battle", "workshop"])
      $(name).hidden = name !== target.dataset.tab;
    document
      .querySelectorAll("[data-tab]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          (b as HTMLElement).dataset.tab === target.dataset.tab,
        ),
      );
  }
});
document.addEventListener("visibilitychange", () => {
  last = performance.now();
  accumulator = 0;
  if (document.hidden && run?.status === "running") {
    paused = true;
    persist();
    render();
  }
});
window.addEventListener("pagehide", persist);
function frame(now: number) {
  const delta = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (run?.status === "running" && !paused && !document.hidden) {
    accumulator += delta * speed;
    while (accumulator >= STEP && run.status === "running") {
      tick(profile, run);
      accumulator -= STEP;
    }
  }
  if (run?.status === "dead" && !run.settled) finish();
  saveTimer += delta;
  if (saveTimer >= 3 && run?.status === "running") {
    persist();
    saveTimer = 0;
  }
  uiTimer += delta;
  if (uiTimer >= 0.1) {
    render();
    uiTimer = 0;
  }
  requestAnimationFrame(frame);
}
if (run) {
  $("overlay").hidden = true;
}
render();
requestAnimationFrame(frame);
