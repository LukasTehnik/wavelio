# Validace balíčku 0.1

- `npm run build`: prošla TypeScript strict kontrola i produkční Vite build.
- `npm test`: 12 testů ve dvou souborech.
- Testy: deterministický běh, nedostatečný cash, reset bojových a zachování trvalých upgradů, odměna nepřítele jednou při více projektilových zásazích, settlement pouze po smrti a pouze jednou, identická simulace po obnovení snapshotu, zastavení pravidel po smrti, boss na 10. vlně, validace poškozených/nepodporovaných save a základní simulace ekonomiky.

## Naměřený startovní balance

Seed 42, čerstvý profil, 1× rychlost, simulace 30 Hz. Automatické jednoduché strategie nakupují jednou za sekundu; neprokazují optimální hraní.

| Strategie                     | Délka do smrti | Vlna | Mince |
| ----------------------------- | -------------- | ---- | ----- |
| Bez nákupů                    | 62 s           | 7    | 22    |
| Střídání poškození / rychlost | 94 s           | 11   | 50    |
| Rotace všech šesti upgradů    | 70 s           | 8    | 33    |

Tato čísla jsou baseline pro změny. První prototyp má krátké běhy pro rychlé zkoušení smyčky. Cíl 5–10 minut vyžaduje další ladění a testy skutečného hraní. Útočná jednoduchá strategie zde převyšuje rotaci všech upgradů; není ověřeno, zda jsou všechny volby dlouhodobě užitečné.

## Omezení sestavení

Phaser je hlavní část JS balíčku (~1.39 MB před gzip; ~362 kB gzip). Vite na velikost chunku upozorňuje. Před vydáním změřit načítání a výkon, případně oddělit načítání enginu. Není to chyba sestavení.

## Před veřejným vydáním

Testovat fyzický Android a iPhone, dlouhé běhy, heat/battery, přerušení procesu během zápisu, nedostatek místa, starší save verze a obnovu při ztrátě dat. Lokální testy nenahrazují testy na telefonech.

## Prohlížečová kontrola

Headless Chromium, viewport 390×844 a 1440×900: spuštění Phaseru a canvasu, nákup upgradu, pauza, obnovení běhu po reloadu, kontrola vodorovného přetékání. Žádná zachycená JavaScript výjimka. Vizuálně zkontrolován mobilní screenshot. Test fyzického telefonu ještě neproběhl.

Prohlížečová kontrola dále ověřila smrt pomocí testovacího snapshotu, připsání kořisti, trvalý nákup a nový běh s resetovanými dočasnými a aplikovanými trvalými upgrady.
