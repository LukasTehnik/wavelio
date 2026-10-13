# CORE / Tower Starter 0.1

Předatelný, hratelný základ 2D incremental tower-defense hry inspirované principem The Tower. CORE je pracovní název. Nejde o kopii jejího kódu, grafiky ani konkrétního balancu.

## Spuštění

Node.js 22.12+ nebo 24 LTS a npm. Ověřeno zde na Node 24.19.

```sh
npm ci
npm run dev
```

Vite vypíše lokální adresu. Telefon připojený ke stejné Wi-Fi může otevřít síťovou adresu počítače; případně použijte webový hosting.

```sh
npm test
npm run build
npm run preview
```

`dist/` je výstup pro statický webový hosting. Není nutný herní server. Nespoléhejte na otevření `dist/index.html` přes `file://`; použijte HTTP hosting nebo preview.

## Co již funguje

- Jedna aréna, věž uprostřed, automatické zaměřování nejbližšího nepřítele.
- Letící projektily, HP, smrt, výsledky, další běh.
- Nová vlna každých 9 sekund; rychlí nepřátelé od vlny 3, odolní od vlny 5, boss každých 10 vln.
- Šest dočasných upgradů za cash: poškození, rychlost střelby, HP, regenerace, dosah, příjem.
- Tři trvalé upgrady za mince: základní poškození, HP, cash příjem. Nakupují se mezi běhy.
- Pauza, rychlost 1×/2×, rekord, mobilní rozložení a desktop v prohlížeči.
- Ukládání profilu a aktivního běhu jako jednoho snapshotu, záložní snapshot a kontrola načítaných dat.
- Obnovený běh začíná pozastavený; pokračuje tlačítkem „Pokračovat“.
- Simulace v čistém TypeScriptu, oddělená od Phaseru a DOM, fixní krok 30 Hz a seedovaná náhoda.
- Automatické testy základních ekonomických a bojových pravidel.

## Pravidla postupu

Cash je pouze pro aktuální běh. Mince se během něj zobrazují jako kořist a do trvalého zůstatku se připíší po smrti. Po restartu se dočasné upgrady vracejí na nulu, trvalý profil zůstává. Zavření stránky běh neukončí: obnoví se poslední platný snapshot.

Přechod na pozadí boj pozastaví. Neprobíhá offline boj ani offline farmaření. Výzkum a další dlouhodobé systémy jsou zatím plán.

## Ukládání – omezení prototypu

Používá se `localStorage`: profil a běh se ukládají každé 3 sekundy, při nákupu, spuštění, pauze, dokončení a při přechodu na pozadí. Při náhlém ukončení může chybět několik posledních sekund. Ukládání není cloudové, nesdílí se mezi zařízeními a prohlížeč jej může smazat. Na selhání zápisu UI upozorní. Záložní snapshot umožňuje návrat o jedno uložení, ne záruku obnovy všech dat.

Před veřejným vydáním přidejte export/import a vhodnou mobilní persistenci. Před žebříčky a platbami potřebujete serverovou validaci, ne důvěru v tento lokální profil.

## Co zatím není součástí

PWA manifest / service worker, nativní iOS/Android projekt, Capacitor, účty, cloud save, výzkum, perky, karty, moduly, turnaje, monetizace, zvuk a finální grafika. Kapacitor a PWA jsou další kroky; jejich existence se tímto balíčkem neslibuje.

## Předání Claudovi

Nejprve přečíst `CLAUDE.md`, potom `docs/architecture.md` a `docs/roadmap.md`. Existující projekt neobnovovat ze šablony a nepřepisovat bez kontroly. Pro úpravy základní ekonomiky použít `src/core/balance.ts`; pro UI `src/main.ts` a `src/style.css`.

## Hosting na GitHub Pages

Pro nový samostatný repozitář vložte obsah této složky do kořene. Workflow `.github/workflows/pages.yml` provádí testy, build a deployment po pushi do větve `main`. V nastavení repozitáře Pages vyberte zdroj GitHub Actions. Workflow se samo nespustilo a žádný web nebyl tímto balíčkem publikován.

Pokud hru importujete do podadresáře existujícího repozitáře, workflow musí být v KOŘENOVÉ `.github/workflows/` a musí mít nastavenou správnou pracovní složku, cestu k lockfile a cestu k `dist`. Nenechte Clauda měnit existující deployment naslepo.

### Testovací verze tohoto repozitáře

Repozitář `LukasTehnik/wavelio` používá výše popsaný workflow. Jednorázově v GitHubu: Settings → Pages → Source: **GitHub Actions**. Po každém pushi do `main` proběhnou testy, build a nasazení; adresa hry je `https://lukastehnik.github.io/wavelio/` (průběh i chyby jsou v záložce Actions). Vite používá `base: "./"`, takže hra funguje i v podadresáři `/wavelio/`. Save v `localStorage` je vázaný na adresu, takže testovací verze má vlastní postup oddělený od lokálního `npm run dev`.

## Validace

Viz `docs/validation.md`. Balance je startovní experiment, ne finální ekonomika.
