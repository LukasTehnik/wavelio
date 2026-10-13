# Architektura 0.1

## Moduly

| Soubor                 | Odpovědnost                                              |
| ---------------------- | -------------------------------------------------------- |
| src/core/balance.ts    | Konstanty, ceny, caps a upgrade definice                 |
| src/core/model.ts      | Typy, statistiky, RNG, souboj, nákupy, settlement        |
| src/core/storage.ts    | Snapshot profil+běh, validace dat, localStorage, backup  |
| src/view/Arena.ts      | Phaser Scene; pouze vykreslení stavu                     |
| src/main.ts            | Boot, DOM, vstupy, fixní timestep, pauza, save lifecycle |
| src/style.css          | Mobilní rozložení a vizuální styl                        |
| src/core/model.test.ts | Invarianty herních pravidel a save                       |

## Čas a pořadí

requestAnimationFrame měří uplynulý čas. Aktivní hra ukládá čas do akumulátoru a opakuje `tick` po 1/30 sekundy. Vizuál běží nezávisle v Phaseru. Zpoždění jednoho frame je omezeno na 100 ms; přetížené zařízení tedy zpomalí simulační čas místo nekonečného dohánění. Po návratu z pozadí je hra explicitně pozastavená.

Tick: postup času a spawn → regenerace → pohyb a nepřátelské útoky → smrt → zaměření a výstřel → pohyb projektilů a zásahy → odstranění mrtvých nepřátel. Pokud věž padne, tentýž tick už nezpracuje její zbývající projektily. Toto pořadí je explicitní designové rozhodnutí.

Vlny jsou časové intervaly, ne čekání na vyčištění celé arény. Mohou se překrývat. Limit aktivních nepřátel je 160; spawn při limitu čeká.

## Zdroje hodnot

Poškození = 10 + 2×trvalá úroveň + 3×bojová úroveň.
HP = 100 + 10×trvalá úroveň + 20×bojová úroveň.
Útoky/s = 1.2 + 0.15×bojová úroveň.
Regenerace = 0.4×bojová úroveň HP/s.
Dosah = 110 + 4×bojová úroveň (max 170).
Cash násobitel = 1 + 0.08×trvalý příjem + 0.15×bojový příjem.

Cash příjem neovlivňuje trvalé mince. To je záměrné omezení prototypu. Výchozí cena bojového upgradu × 1.27^úroveň; trvalá cena 8×1.6^úroveň, zaokrouhlení nahoru.

## Save a transakce

`Session { version:1, profile, run }` je jediná uložená jednotka. Pokud je běh dokončen, do save jde run=null a profil s připsanou kořistí. Pokud je rozehraný, do save jde plný běh včetně RNG, nepřátel, střel, timerů a upgradů. Po načtení je běh pozastavený.

Primary + předchozí validní backup. Neplatná data nejsou použita; fallback může znamenat ztrátu posledního snapshotu. Upozornění na selhání zápisu je v UI. Zápis je best-effort, lokální a nechráněný před úpravou uživatelem.

Požadovaný budoucí adaptér: `StoragePort.load()/save()/export()/import()` s IndexedDB nebo web storage pro web, nativním souborem/SQLite pro mobil. Profil a běh vždy zachovat v jednom transakčním celku. Offline reward případně počítat z timestampů po návratu, ne spoléhat na skryté časovače.

## Co škálovat později

Při stovkách projektilů: mapa enemyId → enemy, pooling render objektů, omezení efektů a výkonové měření. Nyní se vykresluje přes jeden Graphics objekt; hledání cílů je lineární. Přidání obecného ECS nebo fyzikálního enginu není pro tuto fázi potřebné.
