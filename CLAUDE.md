# Instrukce pro Claude: CORE Tower Starter

## Kontext uživatele a záměr

Uživatel chce vlastní 2D hru na principu The Tower, primárně pro mobil na výšku, dostupnou i v desktopovém prohlížeči. Chce vývoj řídit prompty přes Claude a GitHub. První krok je webový prototyp, nikoli samostatný herní editor. Herní loop: automatický boj → průběžné investice → prohra → trvalý workshop → silnější další běh.

Pracovní název je CORE. Názvy, svět a finální grafika jsou otevřené. Toto není pokračování jiného idle RPG; neslučuj automaticky inventář, crafting ani jeho materiály. Nový projekt má vlastní scope.

## Stack a jeho význam

- TypeScript ve strict režimu: pravidla, data, simulace a UI logika.
- Phaser 4.2.1: vykreslování bojiště přes WebGL/Canvas. Není autoritou pro výpočty souboje.
- Vite 8: lokální dev server a produkční sestavení.
- HTML/CSS: mobilní ovládání, workshop a statistiky. React není potřebný pro tuto fázi.
- Vitest: testy pravidel. Konkrétní instalace je zamčená v package-lock.json.
- Později PWA a Capacitor pro mobilní distribuci. Aktuálně nejsou implementované.
- První prototyp nemá backend. Nejprve ověřit smyčku, ovládání a výkon.

Phaser 4 je výslovně použitá hlavní verze. Neber slepě příklady pro Phaser 3 a nemíchej API verzí. Upgrade závislostí dělej jako samostatnou změnu s buildem a testy.

## První převzetí

1. Prohlédni existující repozitář a instrukce. Pokud je prázdný, použij obsah složky jako root nového projektu.
2. Pokud repozitář již obsahuje jinou aplikaci, nejprve izolovaně importuj `tower-starter/`. Nevynucuj nahrazení jeho package.json nebo CI.
3. Přečti README, architekturu, roadmap a validaci.
4. Spusť `npm ci`, `npm test`, `npm run build`.
5. Otevři hru v prohlížeči a ověř běh, upgrade, pauzu, smrt, odměnu, workshop a obnovení snapshotu.
6. Potom připrav testovací webové nasazení podle možností repozitáře. Nekopíruj pracovní prototyp do produkčního webu bez instrukce uživatele.

## Neměnné architektonické zásady

- `src/core/` nesmí importovat Phaser, DOM, React ani herní scény. Storage je platformní adaptér, nikoli součást výpočtu boje.
- Vykreslování čte stav; nesmí rozhodovat o odměnách nebo poškození.
- Herní simulace běží v krocích `STEP=1/30`. Rychlost 2× přidává kroky, ne dvojnásobné poškození.
- Run a permanentní profil jsou oddělené. Save obojí zapisuje atomicky jedním snapshotem.
- RNG v simulaci je seedované. Nepoužívej tam Math.random() ani Date.now().
- Reward se přičítá jednou. Respektuj guard `run.settled`.
- Upgrady mají cap; ceny jsou celočíselné. Nedovol záporné peněženky.
- Dosah, DPS, ekonomika a HP jsou oddělené veličiny.
- Ukládání má verzi a backup. Při změně schématu doplň migraci a test, nemaž uživatelům postup.
- Lokální snapshot není ochrana proti cheatování. Před online soutěžením navrhni autoritativní pravidla.

## UX a vizuál

Mobil portrait jako výchozí. Ovládání dotykem i myší; minimálně 44 px dotykové plochy, safe areas a bez vodorovného přetékání. Jednoduché geometrické placeholdery, monospace, tenké linky, tmavé pozadí a decentní zelený akcent. Finální styl není odsouhlasený.

Hráč musí rozlišit cash, kořist tohoto běhu a trvalé mince. Dočasné nákupy musí jasně říkat, že platí pouze v běhu. Trvalé nákupy jsou během boje zablokované.

## Co v první iteraci nepřidávat

Žádné gacha, deset měn, multiplayer, crafting, reklamy nebo obchody. Žádný předčasný kompletní přepis do Unity/Godot. Nejprve ověř zábavnost základní smyčky a rozšiřuj ji po jednotlivých systémech.

## Nejbližší práce

1. Ověřit a upravit tempo podle skutečného hraní; požadovaný cíl je přibližně 5–10 minut pro první rozvinuté běhy. Současná startovní čísla tento cíl negarantují.
2. Export/import save, lepší obnova při chybách a informace o kořisti před opuštěním.
3. Smysluplné buildy: přidat jeden systém měnící chování, např. volitelné moduly nebo perky, nikoli jen další procenta.
4. PWA a test na skutečném Androidu/iPhonu.
5. Brzký test Capacitor mobilního buildu; vhodné nativní úložiště.

## Jak reportovat změny

Uveď, co hráč nově může dělat, co jsi změnil, jak jsi to ověřil a co ještě není hotové. Neprezentuj plánované funkce jako implementované. Finální čísla měň podle simulací a hraní, ne odhadem podle dojmu.
