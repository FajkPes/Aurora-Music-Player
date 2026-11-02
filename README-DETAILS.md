> **Current modular application: Aurora v2.7.0, published 2026-10-23.**
> Download the latest ZIP, unpack the whole folder and open `index.html` or `START AURORA.bat`. All JavaScript files must stay beside index.html. This local development line uses its own 2.x numbering; the historical 6.x single-file releases remain available under Releases. Personal music profiles/settings and development backups are excluded.

# Aurora Music Player v2.7.0

### Nápověda u názvů a vykreslování až 240 FPS — 2026-10-02

Po aktualizaci znovu načtěte `index.html`. Moduly mají společnou verzi `2.7.0`; uložená nastavení a profily zůstávají kompatibilní.

- **Kompaktní nápověda:** vysvětlení nastavení se zobrazují v šedé bublině po najetí na podtržený název, zaměření klávesnicí nebo klepnutí. Tlačítka Podrobnosti zmizela. Bublina se drží v okně a zavře se při odchodu, scrollování, změně stránky nebo zavření nastavení. Popisy zůstávají přístupné čtečkám, vyhledávání i v dynamických editorech a přepínají se mezi češtinou a angličtinou. Průběhové a chybové zprávy zůstávají viditelné.
- **Přejmenování:** `MusicSense · on screen live values` / `MusicSense · živé hodnoty na obrazovce`.
- **Podpora 240 FPS:** horní limity pozadí, vizualizéru a deformace jsou nastavitelné až na 240 FPS, po jednom FPS (také 144 a 165). Dosavadní uložené limity se nemění. Nastavují se v **Obecné → Výkon**, **Vizualizéry → Obecné** a **Vizualizéry → Efekty / Filtry → Vykreslování**. Poslední skupina vyžaduje Pokročilé. Časování drží průběžný termín snímku, aby při rozdílné frekvenci displeje zbytečně neztrácelo snímky; při zpoždění nevytváří frontu doháněných snímků. Drift a houpání pozadí používají uplynulý čas, takže se při přechodu ze 120 na 240 FPS nezrychlí.
- **Úspory práce:** spektrum se budí při nových datech nebo změně nastavení, ustálená pozastavená časová osa spí. Skrytá křivka hlasitosti se čistí jen jednou. Živé hodnoty se neobnovují v jiných stránkách nastavení a zavřené editory mapování se přeskakují. Ukazatele úrovně používají ořez místo změny šířky rozvržení, se stejnou výškou, barvami a zakulacením.
- **Výpočty a přenosy:** FFT pásma sdílejí neměnné výpočetní tabulky, ale zachovávají vlastní historii. Přepnutí skladby znovu použije buffery. Do hlavního vlákna se neposílá celé spektrum, pokud jej zpracovává worker; při jeho selhání se přenos obnoví. Vypnutý vizualizér nepřebírá zvukové pakety, kruh nepřenáší nevyužitou vlnu a vlna nepřenáší nevyužité spektrum. Seřazené body křivek se ukládají do slabé cache, která reaguje i na průběžné tažení bodu.
- **GPU:** shodné hodnoty parametrů shaderu se znovu neposílají ovladači; skrytý spektrogram nevyvolává zbytečné čtení stylů a geometrie. Rozlišení, počet objektů, efekty a přesnost zvukové analýzy se těmito úpravami nesnižují.

**Ověření:** syntaxe JavaScriptu a všech 14 Node regresních sad prošly. Nová sada porovnává FFT s přímým matematickým výpočtem a zkouší časování 60/120/144/240 FPS na simulovaných 120/144/240/360Hz hodinách. Sdílený vizualizér při simulovaném 240Hz signálu skutečně vykreslil 240 snímků za sekundu. Browser testy ověřily nápovědu při šířkách 1440/760/390 px, překlady, ovládání, přehrávání skutečných syntetických WAV, uložení/obnovu relace a režim bez workerů či úložiště. Rozložení všech stránek nastavení prošlo také při 1080/760/390 px. Screenshoty nové nápovědy jsou v `review-screenshots/hover-settings-*.png`.

**Limity měření:** průběžné 30sekundové srovnání v headless Chrome při 1920×1080 drželo pozadí na 120 FPS a vizualizér na 60 FPS, bez chyb. V úseku 5–30 s klesl součet CPU času rendererů na sekundu z 0,612 na 0,570 s a CPU času procesu GPU z 0,953 na 0,849 s. Jde o jeden orientační pár běhů s výchozím nastavením a syntetickým zvukem, před závěrečnou úpravou odesílání parametrů shaderu, nikoli obecný výsledek pro libovolnou hudbu a efekty. CPU procesu GPU není vytížení samotného GPU ani VRAM. Stabilních 240 FPS na fyzickém displeji, celková spotřeba VRAM a všechny extrémní kombinace efektů nejsou ověřené. Vyšší limit může spotřebu zvýšit; finální FPS omezuje displej, prohlížeč i hardware.

Původní produkční soubory a průběžná měření jsou v `backups/hover-performance-2.6.1-2026-10-02`. Název zálohy vznikl před rozšířením zadání o 240 FPS. Následující záznamy popisují starší verze.

### Knihovna, přehrávání a výkon — 2026-10-02

Přehrávač se stále spouští otevřením `index.html`, bez instalace a sestavování. Po aktualizaci obnovte stránku; všechny moduly používají společnou verzi `2.6.0`. Dosavadní nastavení, vizualizace a profily zůstávají kompatibilní.

- **Rychlejší knihovna:** změna přehrávané skladby, pauza a aktualizace odznaků znovu neprohledávají ani neřadí celou knihovnu. Filtr má cache podle dat a nastavení; vyhledávání bez diakritiky umí více slov současně v názvu, interpretovi a názvu souboru. Worker i záložní režim používají stejná pravidla. Řazení se obejde bez rozbalování velkého pole do argumentů, které selhávalo u velkých knihoven.
- **Správa skladeb:** filtr Vše / Oblíbené, přehled počtu a součtu známých délek, tlačítko pro nalezení právě přehrávané skladby. Nabídka `•••` u skladby nabízí Přehrát další, Přehrát nyní a Odebrat z knihovny. Odebrání včetně vyprázdnění lze vrátit přes oznámení Zpět nebo nabídku knihovny; pamatuje se poslední odebrání do obnovení stránky. Originální soubory se nemažou.
- **Fronta a pořadí:** rozbalovací fronta pod hledáním umožňuje vybrat, odebrat nebo vyprázdnit čekající skladby. Ruční Další respektuje frontu. Opakování přepíná vypnuto → celý playlist → jedna skladba. Automatické opakování jedné skladby má přednost před frontou. Náhodné přehrávání používá konečný seznam nepřehraných skladeb a skutečný pohyb zpět/vpřed historií.
- **Pokračování v poslechu:** ukládá se poslední skladba, pozice, hlasitost a fronta. Bez zapamatované knihovny je po otevření nutné znovu vybrat původní soubory; odpovídající skladba se připraví na uložené pozici. Přehrávání se při obnovení samo nespustí.
- **Volitelné zapamatování celé knihovny:** v `Playlist → ••• → Zapamatovat knihovnu` nebo odkazem dole v playlistu. Zvukové soubory se ukládají do IndexedDB v tomto prohlížeči; při změnách se zapisují pouze nově přidané soubory a změněný seznam. Zapnutí zabere diskové místo podle velikosti hudby. Vypnutí odstraní uložené kopie, původní soubory zůstanou. Není to záloha: data může odstranit uživatel či prohlížeč a dostupná kapacita závisí na jeho pravidlech. Selhání zápisu je viditelné. Přesun programu nebo jiný prohlížeč může používat jiné úložiště.
- **Export a import:** nabídka knihovny exportuje standardní `.m3u8` v aktuálním pořadí. Jde o seznam relativních cest, nikoli balík hudebních souborů; umístěte jej vedle odpovídajících souborů/složek. Import zvuku ignoruje duplicity, dovoluje opětovné vybrání stejného souboru a přetažené složky prochází i po více dávkách a vnořeně tam, kde to prohlížeč podporuje.
- **Spolehlivé ovládání:** stav Play/Pause navazuje na skutečné události audio prvku, chyby přehrávání jsou viditelné a zrušená analýza nesmí později spustit zvuk. Známé LUFS profily už nespouštějí simulovanou analýzu. Při pauze a načtené nepřehrávané skladbě se uspí AudioContext i smyčka MusicSense; přehrávání je znovu probudí. Prohlížeče s Media Session dostávají název skladby, interpreta, pozici a ovládání přehrávání.
- **Klávesnice a přístupnost:** tlačítko `?` ukazuje zkratky. Mezerník/K přehrává, šipky vlevo/vpravo posouvají o 5 s, Shift + šipky mění skladbu, šipky nahoru/dolů mění hlasitost a M ztlumí. Ctrl/⌘ + F hledá v knihovně, Ctrl/⌘ + K v nastavení. Playlist podporuje šipky, Home/End, Enter a Delete; nabídky mají ovládání klávesnicí, dialogy vracejí fokus. Časová osa je přístupný posuvník.
- **Ochrana profilů:** import nově zachová i samotné oblíbené skladby a statistiky bez LUFS. Kontrolují se typy a velikost křivek. Pokud localStorage nestačí na křivky, uloží se alespoň LUFS, oblíbené a statistiky. Úplné selhání se oznámí. Přehrávač se spustí i s blokovaným úložištěm, v takovém režimu se však změny nemusejí zachovat.

**Měření:** při 50 obnoveních syntetické knihovny o 20 000 skladbách v headless Chrome (1440×1000) klesl medián z **8,4 ms na 0,3 ms**, p95 z **13,5 ms na 0,5 ms**. Po úvodním načtení zmizelo všech 50 opakovaných požadavků na hledání i 50 plných řazení. Jde o měření obnovy playlistu při stejném filtru a řazení, bez přehrávání; není to důkaz obdobného zrychlení GPU, dekódování nebo celého programu. Surové výsledky jsou v `backups/upgrade-2.6.0-2026-10-02/library-before.json` a `library-after.json`.

**Ověření:** `node tests/run.cjs` kontroluje syntaxi a všech 13 Node regresních sad. `tests/player-upgrade-browser.cjs` ověřuje skutečné přehrávání syntetických WAV, hledání, frontu, shuffle historii, opakování, odebrání/vrácení, obnovení souborů/pozice/hlasitosti po reloadu, odmítnuté přehrávání a rozhraní v šířkách 1440, 760 a 390 px. `tests/player-fallback-browser.cjs` ověřuje režim bez workerů, zakázané úložiště, neplatný zvuk a prázdné výsledky. `tests/settings-organization-browser.cjs` ověřuje všechny stránky nastavení v obou režimech. Browser testy vyžadují Playwright a Chrome; jejich cesty lze předat přes `AURORA_PLAYWRIGHT` a `AURORA_CHROME`. Funkčnost fyzických mediálních tlačítek, telefonů a ostatních prohlížečů tím není ověřena.

Nové části jsou v `library-tools.js` (knihovna a UI), `player-experience.js` (transport a ovládání) a `library-session.js` (uložení knihovny a relace). Původní produkční soubory jsou v `backups/upgrade-2.6.0-2026-10-02`, screenshoty v `review-screenshots/upgrade-*.png`. Následující záznamy popisují předchozí verze a jejich tehdejší stav ověření.

### Přehlednější nastavení — 2026-10-01

- Nastavení se řadí podle funkce: **Obecné, Přehrávač, Audio, Vizualizéry, Pozadí, Časová osa a Data**. Barvy pozadí jsou u pozadí, vzhled kartiček u kartiček a efekty scény u vizualizérů. Výkon je v Obecné; úpravy samotného okna nastavení jsou pokročilé.
- Základní režim zpřístupňuje hlavní volby; jemné parametry, analýza a ladění jsou v **Pokročilé**. Ze 290 předem vytvořených polí zůstává 70 základních. Přepnutí režimu nemění uložené hodnoty. Hledání najde i pokročilé volby a při jejich otevření zapne pokročilý režim.
- Jednotné rozestupy, zalamování popisků, postranní navigace na desktopu a přizpůsobená navigace v úzkém okně. Dlouhá vysvětlení se rozbalují přes Podrobnosti. Závislé volby se zobrazují podle hlavního přepínače; anglické i české názvy odpovídají novému uspořádání.
- **Ověření:** 12 Node regresních sad a syntaxe kořenových JS souborů. `tests/settings-organization-browser.cjs` prošel všechny stránky v základním i pokročilém režimu při šířkách 1080, 760 a 390 px, včetně přetékání, vyhledávání, podmíněných polí, unikátních ID a zachování hodnot. Browser kontrola 60 přestaveb nastavení měla stabilních 10 535 DOM uzlů a 1 190 posluchačů, bez starých editorů v kontrolovaných cache. Nejde o měření celkové paměti procesu.
- Původní soubory jsou v `backups/settings-reorganization-2026-10-01`, audit v `layout-audit.json` a snímky v `review-screenshots/settings-*.png`. Skripty používají společnou verzi `2.5.0-settings1`; po aktualizaci přehrávač znovu načtěte.

### Únik paměti při renderování a náklady UI — 2026-10-01

- **Potvrzená hlavní příčina:** přepisování deseti zděděných barevných CSS proměnných přímo na `<html>` při animaci. V Chrome rostla nativní paměť rendereru, zatímco JS heap zůstával kolem 4 MiB; problém se reprodukoval i s vypnutým pozadím. Paleta nyní aktualizuje jediné CSS pravidlo. V prohlížečích s `CSS.registerProperty` jsou barvy neděděné a pravidlo cílí jen na jejich skutečné CSS spotřebitele včetně pseudo-elementů. Starší prohlížeče používají děděné pravidlo. Barevná synchronizace ani nastavené FPS se nesnižují.
- **Srovnání bez pozadí:** původní zápis dosáhl 965 MiB privátní paměti hlavního rendereru za 28 s; opravený přehrávač měl 188 MiB po 130 s. V porovnatelném úseku 5–25 s klesl čas přepočítávání stylů o 69 %, CPU rendererů o 43 % a součet CPU rendererů + GPU procesu o 26 %. Jde o izolovaný headless Chrome v 1920×1080 na místním GPU RTX 3070, se stejným syntetickým WAV, vypnutou normalizací a analýzou waveformu. Nejde o celkovou paměť Chrome ani naměřené procento vytížení Ryzen 5600X. Surové záznamy: `backups/memory-2026-10-01/measurements/memory-cpu-before.jsonl` a `memory-cpu-after.jsonl`.
- Pozadí počítá mapování velikosti, rychlosti a bluru jednou pro vrstvu a snímek, místo opakování pro každý blob. Počet blobů závisí pouze na nastavení. Tvary bez bluru se ve workeru kreslí přímo z uložené geometrie bez přebarvování pomocných bitmap; záložní SVG renderer při nulovém bluru odpojuje Gaussian filtr. Zapnutý blur a zrcadlení zůstávají zachované.
- Vypnutí pozadí uvolňuje masky, přebarvené bitmapy a historii stop. Záložní stopy mají stejný limit plochy jako scéna a po vypnutí zmenší canvas na 1×1. Opravené jsou také odkazy na staré editory v cache živých hodnot, hledání a pointer glow, obsah zavřené select nabídky, ukončení DSP AudioWorkletu při selhání workeru, rušení hromadné analýzy a uvolňování shaderů při chybě kompilace nebo ztrátě WebGL kontextu.
- **Ověření:** 12 Node regresních sad a syntaxe kořenových JS souborů; native Chrome kontrola barev UI; 36 pixelových porovnání 9 tvarů s různou velikostí, rotací a zrcadlením; 60 přestaveb nastavení se stabilními 9 592 DOM uzly a 1 188 posluchači a bez odpojených prvků v kontrolovaných cache. Záložní renderer po 65 s držel 102 MiB hlavního rendereru bez chyb. Běžné worker pozadí drželo 120 FPS a vizualizér 60 FPS. Při 130 s zátěže se všemi 44 bloby, stopami a jiskrami zůstala paměť hlavního rendereru přibližně 160–170 MiB; nešlo však o plynulých 120 FPS — GPU proces používal přibližně 1,1 GiB a pozadí kolem 50 FPS. Tato extrémní konfigurace zůstává náročná; měření nepotvrzuje odstranění všech možných záseků ani limit paměti celého prohlížeče. Nativní dekódování dlouhých skladeb stále může způsobit dočasnou paměťovou špičku.
- Volitelné skutečné browser testy: `tests/memory-browser.cjs`, `tests/memory-ui-browser.cjs`, `tests/memory-palette-browser.cjs`, `tests/memory-shapes-browser.cjs`. Vyžadují Playwright a Chrome; cesty lze předat přes `AURORA_PLAYWRIGHT` a `AURORA_CHROME`. Například `node tests/memory-browser.cjs 120 no-bg`. Reprodukce původního úniku: mód `no-bg-inline-baseline`; těžká scéna: `background-stress`; záložní renderer: `fallback`. Běžné Node testy tyto volitelné soubory nezahrnují.
- Původní upravené produkční soubory jsou v `backups/memory-2026-10-01`. Po aktualizaci je potřeba přehrávač plně znovu načíst; tehdejší verze URL modulů byla `2.4.4-memory1`.

### Plocha scény, dynamika basů a mobilní omezení — 2026-10-01

- Pozadí, vizualizér, shader a postprocesové masky používají skutečnou plochu scény vedle desktopového playlistu. Zavření playlistu obnoví plnou šířku; mobilní drawer scénu nezmenšuje.
- Vizualizér dostává samostatné float hodnoty spektra s rozsahem −80 až 0 dB. Původní byte data se zastropovala nad −30 dB a vyrovnávala hlasité basy. Audio normalizace a ostatní analýza/spektrogram zůstávají stejné. Hlavní thread používá float data z analyseru, worker FFT vlastní float pásma.
- Mobilní rozhraní do 600 px automaticky vypne animované pozadí i shader/SVG postprocessing. Omezení platí pouze při renderování a nepřepisuje uložené desktopové hodnoty.
- Výchozí řazení názvů je A → Z, shodně v zabudovaném presetu a JSON. Kliknutí na viditelnou horní i spodní kartu bylo ověřeno v prohlížeči; neplatná LUFS hodnota již neblokuje sestavení detailu.
- Synchronizace tempa používá společnou dvousloupcovou mřížku s popisky nad vstupy, oddělenými řádky a samostatnou živou hodnotou. Anglické rozhraní má doplněné překlady citlivosti tempa a zdroje.
- Ověřeno deset Node sad a syntaxe všech kořenových JS souborů. V prohlížeči při přehrávání syntetického WAV mají scéna, vizualizér a aktivní deformace stejnou šířku vedle playlistu; obě informační kartičky jdou otevřít. Na šířce 390 px má formulář zarovnaná pole, pozadí je vypnuté, shader skrytý a přepínač pozadí zakázaný. Konzole nehlásila chyby. Fyzický telefon a poslech více reálných skladeb nebyly součástí této kontroly.

### Konzistence nastavení a kompaktní přehrávač — 2026-10-01

- Společné rozbalovací sekce, přepínače, mapování, tlačítka a rozestupy. Hlavní volby zůstávají nahoře; křivky, boost, tempo a podrobnosti mají sdílené rozbalování. Globální Spectrum color speed je v **Appearance → Colors**, override mapování jednotlivých vrstev zůstává u vrstvy. Doplněné anglické popisky a zarovnání palet.
- Barvy UI se aktualizují i během scrollování playlistu; jejich pozastavování kvůli výkonu bylo odstraněno. Barvy pokračují i s vypnutým pozadím v hlavním i worker renderování. Scroll už nepřepíná skleněné panely do neprůhledného materiálu. Informační popovery sdílejí sílu a dosah proximity glow s odpovídajícími panely.
- Playlist se v okně do 1100 px automaticky schová a vysouvá zprava tlačítkem, gestem nebo na desktopu najetím k pravému okraji. Po výběru skladby se schová. Vizualizéry mají schovaný panel zleva i na desktopu, otevření najetím myši, tlačítkem a na mobilu gestem. Escape a volba vizualizéru jej zavřou.
- Mobilní ovládání má menší prvky, přehledný řádek Bass / Mid / High / Loudness bez posledního oddělovače a jediný čas v ovládacím panelu. Desktopový panel vizualizérů a čas mají rezervu nad timeline podle výšky křivky hlasitosti.
- Úvodní blok MusicViz sdílí středovou osu ovládacího panelu při otevřeném i zavřeném playlistu. Informační karty používají tenčí a jemnější glow; srdíčko popoveru je skutečné tlačítko zapojené do společného hover efektu.
- Nové společné části jsou v `settings-layout.js` a `compact-player.js`. Původní upravované soubory jsou v `backups/settings-consistency-2026-10-01`.
- Ověřeno deset Node regresních sad a syntaxe JavaScriptu; prohlížeč s přehráváním syntetického WAV, vypnutým pozadím, worker renderováním, úzkým desktopem a mobilním viewportem. Směry swipe, odmítnutí svislého scrollu, otevření myší a shoda glow mají regresní testy. Dotyk na fyzickém telefonu nebyl ověřen. Snímky jsou v `review-screenshots`.

### Review a opravy — 2026-10-01

- Nastavení má společné rozestupy řádků, nápověd a sekcí. Základní volby vizualizérů jsou před detaily; import/přehrávání je před vykreslováním a celková záloha nastavení před profily. Měření výkonu a export výsledku jsou v **Data → Výkon**, s neutrálním vzhledem sdíleným s ostatními akcemi.
- **Pozadí → Vrstvy** používá kompaktní pojmenované tvary, základní rozměry nahoře a rozbalovací skupiny Pohyb a rotace, Jas a efekty, Reakce na hudbu. Otevřené skupiny se zachovávají při změně tvaru či přepínače. Koš, který pouze duplikoval vypnutí vrstvy, byl odstraněn. Zavřené editory se nevytvářejí; zůstávají dostupné přes vyhledávání.
- Změna počtu teček aktualizuje pouze hodnotu, podíly vrstev a souhrn. Nepřestavuje celý editor během tažení. Dynamické popisky mají jedinečná ID a ovládání si při přestavbě zachovává fokus.
- Prázdný přehrávač používá nastavenou paletu MusicViz (výchozí růžová/fialová) i pro Play a aktivní vizualizér. Barevná synchronizace s hudbou se aktivuje až s načtenými skladbami. Verze URL skriptů brání míchání starých a nových modulů z cache.
- Výchozí nastavení tvoří jedna čitelná sada podle `musicviz-nastaveni-2026-10-01.json`. Platí pro první spuštění a **Obnovit doporučené**; vlastní uložené volby mají nadále přednost. Preset je vložen do JavaScriptu, takže funguje i otevření `index.html` bez serveru.
- Načítání a import používají společné sloučení s kontrolou typů a doplněním neúplných mapování. Vymazané override nastavení vrstvy zůstává vymazané. Reset používá stejnou cestu jako import a obnovuje také select nabídky, vizualizér a přístupné ovládání.
- Editory křivek nehromadí globální posluchače při opakovaném vytváření. Používají pointer capture, ošetřují přerušení tažení, překreslují nejvýše jednou za animační snímek a znovu využívají DOM bodů. Aktualizace tooltipů zpracovává změněné podstromy místo opakovaného prohledávání celých panelů.
- Oblíbenost, délka a počet přehrání už nejsou považovány za hotovou LUFS analýzu. Počet profilů zahrnuje pouze skutečné analýzy; neplatná hlasitost se neposílá do audio grafu. Import s vypnutou normalizací obnoví jednotkový gain.
- Opakovaný reset/import nehromadí obsluhu selectů efektů. Ukládání se dokončuje také při `pagehide`; selhání zápisu nastavení se zobrazí uživateli. Podobná tlačítka a nabídky sdílejí vzhled a viditelný fokus. Ovládání vrstev, výběr tvarů a barevné vzorky používají skutečná tlačítka; přestavěné vrstvy znovu dostávají přístupné přepínače.
- Ověřeno: devět Node regresních sad, syntaxe JavaScriptu a funkční test v prohlížeči s importem tří syntetických WAV souborů, normalizací, přehráváním, rychlým přepínáním a otevřením nastavení. Testovací simulace byly aktualizovány pro aktuální rozhraní a nezávislost na presetových hodnotách. Původní soubory jsou v `backups/review-2026-10-01`.
- V prohlížeči navíc ověřeno rozbalování vrstev, podmíněné volby tvaru/pohybu, vyhledání zavřené vrstvy, zachování fokusu posuvníku a umístění benchmarku. Vizuální kontrola proběhla v desktopovém okně; úzký viewport nástroj neuplatnil a není vizuálně ověřený.
- Tento průchod neměří zrychlení na skutečné hudební knihovně. Nativní dekódování celé skladby a upload canvasů do GPU zůstávají oblastmi pro měření při reálné zátěži. Nepotvrzuje odstranění všech záseků ani limit celkové procesové/GPU paměti. Pro srovnání použijte existující 60sekundový benchmark za stejných podmínek popsaných níže.

### Track-start analysis, trails and spectrum — 2026-09-26 (not tested)

- Analysis decoding uses a minimal OfflineAudioContext instead of opening another real-time audio context. With an analysis worker, decoded channels are copied in yielding 262,144-sample batches, transferred, weighted in place and analyzed there. This removes the full-track offline filtered AudioBuffer from that path. Coefficients follow the [Web Audio biquad definitions](https://www.w3.org/TR/webaudio-1.0/#filters-characteristics) using the existing 1500 Hz / +4 dB shelf and 38 Hz / Q=0.5 highpass parameters. Native offline filtering remains the no-worker fallback. Numerical parity has not been tested; existing cached profiles are retained.
- Full-track decoding and the temporary decoded-plus-transfer-copy peak still exist. These changes do not provide a hard whole-process RAM ceiling or establish the reported memory growth's cause.
- Trail history is capped at 128 points per blob and rendered with at most 48 samples per blob, sharing a 4,096-sample budget across the blob count. Long/dense trails therefore use sparser sampling; their duration is capped at 30 seconds. Worker and main-thread fallback use the same limits. Disabling the worker background drops retained trail histories.
- Spectrum consumes at most the newest pending audio packet per render tick and redraws only when history actually gains a column (or layout/settings/reset invalidate it). Horizontal and vertical mask gradients are reused. DSP sends each consumer only the arrays it needs.
- No executable tests, browser runs or before/after measurements were performed, honoring the user's earlier instruction. Hardware FPS, memory reduction and filter output parity remain unverified.

### Scroll isolation and bounded rendering resources — 2026-09-26 (not tested)

- Playlist rows now use circular recycling: ordinary scrolling repaints only incoming tracks, rather than rebinding the whole visible window. DOM order follows visual order for keyboard navigation. Excess pooled rows are removed after substantial viewport shrink.
- The existing scroll activity class now disables live backdrop blur in the playlist/settings panel and uses an opaque panel background during scrolling. Pointer glow, numeric readouts and decorative UI color writes wait until scrolling ends; audio and scene workers continue. This changes the panel appearance temporarily. It does not move DOM execution into a worker.
- Background, music visualizer and distortion backing stores use at most approximately four million pixels each, with DPR capped at 1.5. Very large/high-DPI views therefore trade scene resolution for memory/fill cost; text remains at native resolution. Spectrum history budget drops from 64 to 16 MiB in worker and fallback paths, shortening available history when necessary.
- Disabled background and visualizer output surfaces shrink to 1x1 and restore on activation. Audio analysis drops compressed input, decoder/context references, offline graph and rendered buffers as soon as each stage no longer needs them; native decoding/offline rendering still require full-track buffers and may have large peaks.
- Where EXT_disjoint_timer_query is available, the WebGL compositor permits at most three outstanding submissions, asynchronously skips uploads while those remain in flight, reuses query objects and releases them with its GL resources. This bounds this compositor's queue, not every browser/GPU allocation. Without the extension, the existing rendering path remains.
- No tests or benchmarks were run, honoring the user's instruction. A 300% speedup, absence of all leaks, and a 500 MiB/1 GiB total browser-process ceiling are not established by these changes.

### Follow-up optimization — 2026-09-26 (not tested)

- DSP FFT caches bit-reversal indices and per-stage twiddle factors, and skips unused raw-spectrum conversion for tempo bands. Visualizers cache logarithmic band boundaries and calculate attack/release coefficients once per frame.
- Compatible grayscale/hue filters are folded into the active WebGL compositor. SVG remains responsible when effect ordering requires it; disabled color operations bypass their shader math.
- Timeline workers continue interpolating playback locally; unchanged playback now needs only periodic anchors. Spectrum colors and background dimensions are sent only when changed.
- Live numeric readouts update at most 30 times per second, skip auto-hidden statistics, and avoid unchanged text writes. Animation/render FPS limits remain unchanged. Mapping readouts visit mounted editors instead of all possible layer overrides.
- Pointer outlines use IntersectionObserver to skip offscreen candidates before layout reads. Time labels avoid replacing identical text.
- At the user's request, no tests, syntax checks or browser benchmarks were run for this follow-up. Runtime correctness, visual parity and performance gains are unverified.

### Rendering optimization — 2026-09-26

- Background worker retains an eight-entry LRU of colored sprites across blobs and frames. Identical shape/blur/color combinations skip tint rendering; changing colors recycle bounded surfaces. This trades at most approximately 3.94 MiB of additional nominal pixel storage for fewer tint operations (browser/GPU overhead is separate). Diagnostics include this cache.
- GPU compositor reads layout and computed styles before resizing/submitting textures, and avoids repeating unchanged output DOM writes. Chroma-only rendering skips identity distortion math in the fragment shader. No FPS caps or quality settings were changed.
- Fixed the background glitch filter's invalid `none hue-rotate(...)` combination when grading is neutral.
- Validation: all eight Node regression suites and root JavaScript syntax checks pass. Cache tests cover alternating colors, mirrors, offscreen culling, eviction and the eight-surface limit. These are simulated canvas/GL tests, not a hardware benchmark; sustained 120 FPS on Ryzen 5600X / RTX 3070 remains unverified. Use the existing 60-second playback benchmark with the actual effects and music workload to measure remaining stalls.

Rozbalte celý ZIP do jedné složky a otevřete `index.html`. Není potřeba instalace, build ani server. Aplikaci tvoří vstupní HTML a 17 JavaScriptových modulů; projekt obsahuje také preset, regresní testy a tento návod.

## Soubory

| Soubor | Obsah | Velikost |
| --- | --- | --- |
| `app.js` | Sdílený stav, registrace, inicializace, threading a diagnostika. | 28.7 kB |
| `settings.js` | Výchozí nastavení, obsluha všech editorů, ukládání a import/export nastavení. | 83.5 kB |
| `ui.js` | Vykreslování rozhraní, náhledy a šablony dynamických ovládacích prvků. | 112.8 kB |
| `templates.js` | HTML všech panelů a stránek. Každá pojmenovaná šablona je zde. | 101.9 kB |
| `appearance.js` | Základní vzhled. Pořadí CSS pravidel zůstává zachované. | 92.5 kB |
| `mobile.js` | Responzivní rozložení, mobilní styly a navazující úpravy vzhledu. | 64.0 kB |
| `background.js` | Pozadí, tvary, pohyb, mapování signálu, barvy, jiskry a stopy. | 64.5 kB |
| `audio.js` | Audio graf, MusicSense, tempo, normalizace LUFS a analytické profily. | 37.4 kB |
| `visualizers.js` | Spektrogram a časová osa včetně waveformu. | 56.6 kB |
| `library-player.js` | Import hudby, rozpoznání interpreta, playlist, přehrávání a hlasitost. | 41.5 kB |
| `workers.js` | Všechny výpočetní a vykreslovací workery a audio worklet. | 97.6 kB |
| `language.js` | Čeština a angličtina. | 65.2 kB |

## Úpravy

- `settings.js` obsahuje výchozí hodnoty, obsluhu editorů a ukládání/import/export nastavení. Vykreslovací funkce, které používají editory, jsou společně s ostatními pohledy v `ui.js`.
- Veškeré HTML šablony jsou společně v `templates.js`, v čitelných blocích mezi zpětnými apostrofy.
- CSS je v čitelných blocích v `appearance.js` a `mobile.js`. Číselné pořadí u `addStyle` zachovává původní prioritu pravidel. Mobilní soubor obsahuje také navazující úpravy vzhledu.
- `workers.js` obsahuje všechny workery v jednom souboru. Fragmenty označené komentáři jsou pouze vnitřní oddíly tohoto souboru.
- Rozpoznávání interpreta má jeden zdroj v `library-player.js`; používá jej i worker.
- Pro změnu vykreslovacího nebo DSP algoritmu zkontrolujte variantu hlavního vlákna i variantu ve `workers.js`. Záložní režim zůstává potřebný.

Moduly sdílejí objekt `window.Aurora`, uvnitř označený `App`. Registrace proběhne při načtení souborů, inicializaci pak spustí `Aurora.boot()` podle pořadí v `app.js`. Soubory načítá `index.html`; nepřidávejte k nim `async`. Po úpravě stačí obnovit stránku.

## Ověření

Kontrola syntaxe všech 12 modulů a regresní kontroly prošly. Spusťte `node tests/ui-regressions.cjs`: ověřuje registrace modulů a šablon, ukládání a migraci hover nastavení, hudební puls oblíbené skladby, obsluhu řazení a klávesnice, dosah glow a zapojení všech metod do skutečného objektu SettingsUI, přepínání kategorií a podtabů, rušení rychle přepínané navigace a časový limit pozastavených animací. Testy používají zjednodušený DOM; neověřují skutečné vykreslování CSS ani přehrávání zvuku.

Vizuální ověření posledních změn nebylo možné: nástroj prohlížeče odmítl přístup k místnímu souboru. Po obnovení `index.html` zkontrolujte otevření/zavření nastavení, podtaby, řazení playlistu a hover oblíbené skladby během přehrávání.

Ve **Vzhled → Animace** lze měnit animace rozhraní, dosah glow (0–300 px) a vzhled prvků Control Islandu při najetí: průhledný, světlejší, jemná záře nebo beze změny. Původní volba průhlednosti se převede automaticky; vlastní nastavení dosahu se zachová.

Přesun HTML může změnit dostupnost původního localStorage podle prohlížeče. Pro přenos uložených dat použijte existující export/import nastavení a profilů. Písma Google Fonts se načítají jako dříve; bez připojení se použijí náhradní písma.

Ve **Vzhled → Ovládací panel** lze měnit zarovnání textu kartičky vlevo/vpravo a její šířku. Režim **Podle názvu a interpreta** použije delší text, omezený dostupným prostorem; **Vyplnit volné místo** zachovává pružnou šířku. Obě volby se ukládají s nastavením.

Ve **Vzhled → Animace** jsou samostatné přepínače pro playlist, živé hodnoty, zvětšení/zmenšení nastavení, taby a rozbalovací nabídky, společná délka 100–800 ms a barva glow. Respektování systémového omezení pohybu je samostatná volba. Nabídky select používají společný zaoblený popup i v dynamických editorech.

Glow v Control Islandu má samostatný dosah 0–100 % globální vzdálenosti (výchozí 50 %); posuvníky nejsou cílem obrysové záře. Barva glow používá vzorky z presetů a HEX. Přechody tabů používají 55 % společné délky. Symmetric wave zrcadlí hover vlnu přes střed časové osy v hlavním rendereru i workeru. Ve Spektrogram → Barvy je HUE offset −180° až +180°, který zachovává blur a mění i již vykreslenou historii.

**Visualizers:** přepínač vlevo dole nabízí vypnutí, equalizér, zrcadlenou vlnu a radiální kruh. Tab nastavení Visualizers obsahuje společnou viditelnost/FPS a samostatné parametry každého režimu. Barvy navazují na přehrávač. Renderer používá jeden canvas nad pozadím pod UI, opakovaně využívané audio buffery, limit 30 FPS ve výchozím stavu a pixel ratio nejvýše 1,5. Při pauze vykreslí statický stav; při skrytí okna nebo vypnutí nevykresluje průběžně. Vzhled v prohlížeči zatím nebyl ověřen.

Vzhled vizualizérů navazuje na v10: equalizér přes celou šířku se svislým gradientem a glow, plnošířková zrcadlená vlna bez zúžení u krajů a kruh s výchozími 180 paprsky a dvojí září. Každý režim má vlastní Sílu záře a Doznívání. Záře sloupců/paprsků se vykresluje společně, gradienty se cachují; doznívání je časově přepočítané podle FPS. Původní výchozí proporce předchozí implementace se při načtení převedou; vlastní změněné hodnoty zůstanou.

### Visualizers — 2026-09-11
- Dedicated `Aurora visualizers` OffscreenCanvas worker, separate from background/UI rendering. DSP sends frequency and waveform samples directly over a bounded MessageChannel. Unsupported/failed workers use the shared renderer on the main thread; fallback analyser packets have acknowledgement backpressure.
- Configurable 15–120 FPS (60 by default for new settings; existing choices preserved). Actual presentation is limited by display refresh and available performance. Hidden, disabled and paused visualizers stop their render loop.
- Canvas remains above the background and below UI. Content is centered within the space left of the playlist and above the timeline/control bar. Equalizer bars expand around the vertical center; ring has mirrored, smoothed frequency rays and a luminous continuous contour.
- Selector now includes text labels. Existing per-preset glow, trail and other controls are preserved.
- Verified with `node tests/ui-regressions.cjs`, `node tests/visualizer-worker.cjs` and JavaScript syntax checks. Worker tests exercise serialized source, frame caps, layout, pause/visibility, audio acknowledgements and fallback. Native browser appearance and real hardware FPS have not been measured in this session.

### Scene filters and visualizer surfaces
`Appearance → Effects / Filters` adds a composited SVG filter chain for scene content (background + stage spectrum + music visualizers), separate from UI. Pixel/warp maps are cached, RGB splitting uses actual source channels, edges use a convolution, and grayscale/hue are color operations. Glitch updates at 15 Hz without rebuilding the graph; source rendering retains its own frame rate. Raster/vignette and existing scanlines overlay the filtered result, with scanlines last. All filters default to zero/bypass. This uses browser SVG/CSS compositing, not a custom WebGL shader. Hardware performance and browser rendering remain unverified.
Visualizer General now offers theme/static HEX palette colors and solid/transparent-outline/tinted-glass surfaces. Glass is a translucent color treatment, not refractive scene sampling.

### Filter refinement
- Pixelization now uses sparse grid sampling + morphological expansion into uniform odd-sized cells, followed by adjustable per-channel quantization. It no longer uses the distortion map. The displayed pixel size matches the effective cell size.
- Signed fisheye, bubble, twist, pinch and waves controls include center, radius and zoom. Spatial map resolution is capped at 384 per axis and reuses a coordinate buffer; maps regenerate only when warp parameters or stage dimensions change.
- Raster supports pixels, circular, square, line and cross patterns with adjustable cell size. Edges use a shifted-image difference instead of the former 3×3 convolution (directional edge appearance; no hardware performance claim).
- Ring ignores all surface styles and has independent temporal smoothing. The custom HEX field is dark; palette starts with purple and includes red instead of orange.
- Node tests cover geometry/control bounds, reverse distortion, graph composition and surface invariance. Browser pixel appearance and GPU performance are still unverified.

### 2026-09-12 — Analytic distortion and local frequency boost
- Distortion runs in `distortion-gpu.js` using a high-precision WebGL fragment shader. It samples worker canvases directly, reuses texture storage, does not generate PNG displacement maps or read pixels back to JavaScript, and has a 30–120 FPS cap. Disabled/hidden rendering sleeps; context loss restores the original scene until recovery. Background canvas rendering is required when the animated background is enabled.
- Protected center radius, smooth mask transition, inverted mask and mirror/repeat/clamp/transparent border sampling apply to background, visualizers or both. Other scene filters remain in the existing compositing chain; UI and final scanlines are outside it. Legacy CSS background effects remain as overlays.
- Threshold boost is now per frequency band (local sample amplitude for Wave), not a global loudness multiplier. Quiet bands retain their original level. Maximum boost, attack and release are adjustable; the old quiet-response and power controls were removed.
- Visualizers receive unsmoothed spectrum magnitudes from the existing DSP FFT, with no second FFT. Logarithmic bands aggregate peaks rather than reading a single arbitrary bin. Ring contours use interpolated bands instead of seven-band averaging; the inner contour shares the outer contour's deformation.
- Checks: ui-regressions.cjs, visualizer-worker.cjs, distortion-gpu.cjs and syntax checks. The GL integration test uses a simulated driver: actual driver compilation, appearance and hardware FPS remain unverified.

### 2026-09-12 — Panorama, ring headroom and selector styling
- Ring peaks are no longer clipped individually to a fixed radius. A shared fit factor reserves room for the entire contour and glow, preserving relative peak shapes.
- Distortion uses the visible scene width up to the animated playlist boundary, including border reflection coordinates. Panorama mode protects a full vertical center strip and displaces only horizontally, independent of height; Radial remains selectable. Mask zero returns the original coordinates before any zoom.
- Visualizer selector shares Control Island chip alpha/blur/radius, chip enable/disable, outline color/opacity/width, hover behavior and local pointer-glow radius. It stays outside the scene shader.
- Node regression tests cover viewport uniforms for shown/hidden playlists, center protection at every height and existing controls. Actual browser appearance and GPU FPS remain unverified.

### Side-only vertical stretch and rendering cost
- Panorama has a 0–100% vertical-stretch control. Both displacement and zoom remain masked to the sides; the protected center returns original coordinates.
- Scanlines can cover the whole scene or background only. Without distortion the background-only layer is below visualizers; with GPU distortion its modulation is applied to the background sample before foreground composition. Existing whole-scene scanlines remain the final overlay.
- Dock corner radii are capped at 18/12/9 px while still following smaller Control Island values.
- Ring ray/ribbon passes no longer each run a shadow blur. Pulse particles are bounded to 768 instead of 1,536; the dedicated Particles style retains full density. Angular coordinates are cached once per frame and reused across contour passes.
- Regression and syntax checks passed; no measured hardware speedup or visual-perfectness claim.

### Desktop rendering and memory maintenance (2026-09-12)
- Equalizer peak range: smooth compression (default), proportional fit, or original hard limit. The compression threshold is adjustable; smooth mode preserves differences between loud frequency bands without artificial noise.
- System / System: rendering power saving can pause on hidden tab/minimize (default), also on window blur, or have no automatic pause. Audio continues; browser scheduling restrictions still apply.
- Spectrum image-run caches retain at most eight entries of at most 512 KiB each in both worker and fallback paths. Single-column buffers are reused. Spectrum history is bounded to 64 MiB; only excess offscreen history is shortened at extreme settings.
- Background sprite cache recycles its 80 canvas surfaces on eviction. Track object URLs are created on demand and revoked on switching tracks. Audio analysis no longer copies the compressed input before decoding and releases its decoded source after offline rendering.
- Compact desktop controls wrap, playlist space remains reserved above 900px, the visualizer chooser clears the timeline, and auto-hidden live stats collapse their reserved height.
- Validation: all modified JS passes `node --check`; `tests/ui-regressions.cjs`, `tests/visualizer-worker.cjs`, `tests/distortion-gpu.cjs`, and `tests/runtime-resources.cjs` pass. These use mock DOM/canvas/GL and numeric assertions. Actual browser layout, GPU performance, and process RAM reduction have NOT been measured; the reported multi-GB process usage is not conclusively attributed to these allocations.

### Follow-up: reported FPS regression
- Reverted mutable background sprite recycling: cached canvas images are immutable again, avoiding a potential GPU synchronization / copy-on-write regression. The cache remains bounded to 80 entries.
- Timeline label placement now remembers its outside width and has hysteresis, preventing its smaller inside font from causing repeated inside/outside layout changes. Unchanged control heights no longer rewrite the root CSS variable.
- Added CPU regressions for settling label placement and immutable sprites. Browser FPS is not measured; this is a rollback of a suspected regression, not confirmation of the reported 5 FPS root cause.

### Bitmap recycling restored
- Restored bounded LRU canvas recycling at the user's request after they reported that restarting after GPU driver installation resolved the slowdown. This does not independently establish the slowdown's cause.
- Retained responsive-layout fixes. Resource regressions verify an 80-surface allocation limit, clear-before-repaint, and no repaint on cache hits. Resource and UI regression suites and worker syntax checks pass; browser FPS remains unmeasured here.

### Rendering cost reduction and real-playback benchmark
- Background skips identity color filters. With neutral grading, full opacity and no glitch, it renders directly to its output canvas; the intermediate surface shrinks to 1x1. Other settings retain the compositing pass. Disabled background clears once instead of repeatedly updating geometry.
- Trail canvas allocation is lazy and is released to 1x1 while trails/sparkles are inactive. Particle arrays are compacted in place. The independent background, spectrum and timeline workers have a configurable 30–120 FPS ceiling.
- Spectrum rendering is invalidated by new audio, resize/settings and track reset, rather than redrawing identical pixels at every display tick. Worker diagnostics distinguish scheduling FPS from paint FPS. A visualizer worker now reports frame cadence and CPU time too.
- Ctrl+Shift+D displays JS heap (where supported) and estimated worker canvas storage. Neither is total tab/driver/GPU RAM. This review has NOT established the root cause of the reported 2 GiB process memory or measured a 300% speedup.

Real-load comparison: reload, import 100+ actual songs, play a song, enable background, desired effects and a visualizer. Set the visualizer and distortion FPS limits to 120 when evaluating the 120 FPS target. In System / System click Measure playback performance (60 s), then close settings during the 10-second warmup. Keep playback running and the tab visible for the following minute. Return to settings and save the JSON. Repeat under identical song position, settings and window size for comparison. For the two-instance target, use two visible windows running concurrently and run the test in both. Browser/Task Manager process and GPU memory must be recorded separately; the JS heap cannot substitute for those measurements.

The benchmark rejects pause, hidden rendering, disabled background/visualizer and playlists below 100 tracks. It marks interrupted/settings-changed runs invalid and records actual workload settings, playback position, viewport, frame-gap percentiles and per-second worker/memory samples. There is no idle sampling outside an explicitly started test. Automated tests use simulated timing and mock canvases, not real browser performance numbers.

Validation: six Node suites pass (ui-regressions, visualizer-worker, distortion-gpu, runtime-resources, background-resources, playback-benchmark), plus syntax checks. Live browser/GPU performance and visual parity of the compositing fast path still require the real-load comparison above.

### Follow-up from supplied playback report
The supplied run (260 tracks, equalizer, 2552x1274 at DPR 1) was interrupted after 11.20 measured seconds when its visualizer condition stopped being met. The partial UI result was 90.18 FPS, p95 16.7 ms, maximum gap 91.6 ms; worker reports were near 120 FPS and the equalizer near its configured 60 FPS. Reported JS heap stayed at 11.9 MB. These observations do not measure GPU time or establish the process-memory cause.

The supplied settings combine distortion with postChroma=1. Eligible chromatic aberration now runs in the existing compositor fragment shader instead of adding the full-scene SVG offset/color-matrix/blend chain. SVG remains the fallback when WebGL is unavailable, on context loss, or when earlier glitch/legacy effects require preserving their order. Settings are not reset. Benchmark JSON now includes compositor CPU submission time and upload counters; these still exclude asynchronous GPU completion cost.

Validation: mock-GL tests cover standalone chroma, uniforms, fallback ordering and context loss/recovery; playback benchmark tests and syntax checks pass. Actual shader compilation, appearance and performance on the user's GPU remain unverified.

### Playback lifecycle and rendering resource fixes (2026-09-12)

- Track changes invalidate obsolete automatic analysis consumers. Queued obsolete work skips decoding; work already inside native decoding/offline rendering finishes that native stage, then stops before further processing. Shared jobs remain valid for other consumers, including explicit bulk analysis. Fallback CPU analysis yields between batches. The serial queue no longer retains the last result.
- Old normalization callbacks cannot start a newly selected paused track or overwrite its progress. Superseded simulated scans cancel their animation frame and visibility subscription. Waveform completion uses a generation token to prevent stale results from interfering with a later request.
- Optional waveform caches retain at most 16 entries and 262,144 numeric samples. LUFS, favorites and playback metadata remain; evicted waveforms can be recomputed. Spectrum resets clear pixel caches as well as history; disabled spectrum releases its canvases, and the worker keeps inactive output surfaces at 1x1.
- Background mirror copies reuse their tinted sprite; fully offscreen sprites skip tinting and draw submission. Distortion releases textures, buffers, program and output storage when disabled/suspended, and skips visualizer texture sampling when that layer is invisible.
- Fixed spectrum worker failure recovery (wrong fallback property), DSP UI-port cleanup, and Blob URL cleanup if worker construction throws. Existing rendering/DSP workers remain in use; the GPU compositor still submits canvas textures from the main thread.

Validation: eight Node regression suites, module/test syntax checks and assembled-worker syntax checks. Added coverage for obsolete/shared analyses, decode cleanup, waveform limits/races, stale autoplay, animation cancellation, mirrored tint reuse and spectrum release/restoration. A local browser smoke test also exercised three synthetic 12-second WAV files, rapid track changes, normalization, AudioWorklet, spectrum and equalizer without logged errors. GPU chroma rendered with an empty error status, then released its output to 1x1 when disabled. This is functional validation, not a before/after FPS benchmark under the user's full music/effect workload, and it does not establish that all leaks or GPU stalls are eliminated.
