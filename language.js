/* language.js — Čeština a angličtina. */

// ── ui/language ──
window.Aurora.define("ui/language", function(){
(function(){
  const LANGUAGE_KEY = 'aurora-language-v2';
  const EN = {
    'Horní limit snímků za sekundu (až 240). Vyšší hodnota umožní plynulejší pohyb na rychlém displeji a zvýší zátěž. Skutečná frekvence závisí na displeji, prohlížeči a zapnutých efektech; rozlišení ani kvalita se tím nemění.':'Frame rate ceiling (up to 240). Higher values allow smoother motion on a fast display and increase load. Actual frame rate depends on the display, browser and enabled effects; resolution and quality stay the same.',
    'Vaše hudba, vlastní atmosféra. Vyberte soubory nebo celou složku a poslouchejte s vyrovnanou hlasitostí a živými vizualizacemi.':'Your music, your atmosphere. Pick files or a folder and listen with balanced volume and live visualizations.',
    'Vybrat hudbu':'Choose music',
    'MP3 · FLAC · WAV · OGG · M4A a další':'MP3 · FLAC · WAV · OGG · M4A and more',
    'nebo sem přetáhněte hudbu / složku':'or drop music / a folder here',
    'Vše':'All',
    'Oblíbené':'Favorites',
    'Správa knihovny':'Library tools',
    'Zobrazit přehrávanou skladbu':'Show current track',
    'Možnosti skladby':'Track options',
    'Klávesové zkratky':'Keyboard shortcuts',
    'Pozice přehrávání':'Playback position',
    'Pozastavit':'Pause',
    'Opakovat jednu skladbu':'Repeat one track',
    'Opakování vypnuto':'Repeat off',
    'Zavřít oznámení':'Dismiss notification',
    'Žádné odpovídající oblíbené skladby.':'No matching favorites.',
    'Nic nenalezeno. Zkuste jiný název nebo interpreta.':'No results. Try another title or artist.',
    'Zatím žádné skladby. Vyberte zvukové soubory nebo sem přetáhněte složku.':'No tracks yet. Choose audio files or drop a folder here.',
    'Import se nezdařil. Zkuste soubory vybrat znovu.':'Import failed. Try selecting the files again.',
    'Výběr neobsahuje podporované zvukové soubory.':'No supported audio files in this selection.',
    'Složku se nepodařilo načíst.':'Could not read the folder.',
    'Profily a oblíbené skladby se nepodařilo uložit. Exportujte je v Nastavení → Data.':'Could not save profiles and favorites. Export them in Settings → Data.',
    'Podíl počtu teček v aktivních vrstvách':'Share of dots in enabled layers',
    'Prstenec':'Hollow ring','Diamant':'Diamond',
    'Tvar a rozměry':'Shape & size','Pohyb a rotace':'Motion & rotation','Jas a efekty':'Brightness & effects',
    'Barvy a povrch':'Colors & surface','Vzhled a efekty':'Appearance & effects','Reakce a vyhlazení':'Response & smoothing',
    'Vykreslování a úspora energie':'Rendering & energy saving',
    'Profily hlasitosti (LUFS) se exportují zvlášť v sekci Uložené profily.':'Export loudness profiles separately under Saved profiles.',

    "Měření výkonu":"Performance measurement",
    "Změřit výkon (60 s)":"Measure performance (60 s)",
    "Exportovat měření JSON":"Export measurement JSON",
    "Změří plynulost přehrávače během 60 sekund. Po spuštění máte 10 sekund na zavření nastavení.":"Measure playback smoothness for 60 seconds. After starting, you have 10 seconds to close settings.",
    "Před měřením načtěte alespoň 100 skladeb, pusťte hudbu a zapněte pozadí i vizualizér. Během testu nechte okno viditelné a neměňte nastavení.":"Load at least 100 tracks, play music and enable the background and a visualizer before measuring. Keep the window visible and settings unchanged during the test.",
    "Limit vykreslování pozadí a spektra":"Background and spectrum frame limit",
    "Změřit výkon při přehrávání (60 s)":"Measure playback performance (60 s)",
    "Uložit měření JSON":"Save measurement JSON",
    "Úspora energie vykreslování":"Rendering power saving",
    "Pauza při skrytí karty / minimalizaci":"Pause when tab is hidden / minimized",
    "Pauza i při ztrátě zaměření okna":"Also pause when window loses focus",
    "Bez automatické pauzy":"No automatic pause",
    "Pozastavuje pouze vizuály, hudba pokračuje. Prohlížeč může omezit snímky skrytých karet i bez automatické pauzy.":"Only visuals pause; music continues. The browser may throttle hidden tabs even without automatic pausing.",
    "Rozsah hlasitých špiček":"Loud peak range",
    "Plynulá komprese špiček":"Smooth peak compression",
    "Přizpůsobit celý rozsah":"Fit the entire range",
    "Původní pevný limit":"Original hard limit",
    "Začátek komprese špiček":"Peak compression threshold",
    "Platí pro plynulou kompresi. Vyšší hodnota ponechá více neomezeného rozsahu před kompresí.":"Applies to smooth compression. Higher values leave more uncompressed range before the knee.",

    "Styl kruhu":"Ring style",
    "Pulse — světelný prstenec":"Pulse \u2014 luminous ring",
    "Particles — částicová membrána":"Particles \u2014 particle membrane",
    "Spectrum — paprsky":"Spectrum \u2014 rays",
    "Tloušťka čar / velikost částic":"Line thickness / particle size",
    "Vytrácení paprsků směrem ven":"Outward ray fade",
    "Pulzování velikosti podle basů":"Bass size pulse",
    "Paprsky / světelné pásy":"Rays / light ribbons",
    "Hlavní obrys":"Main contour",
    "Vnitřní pomocný kruh":"Inner guide ring",
    "Částicová výplň (Pulse / Particles)":"Particle fill (Pulse / Particles)",
    "Tloušťka sloupců":"Bar thickness",
    "Vytrácení od středu ke krajům":"Center-to-edge fade",
    "Zrcadlená druhá vlna":"Mirrored second wave",
    "Rozmazání":"Blur",
    "Deformace kruhu":"Ring deformation",
    "Koncové tečky":"Tip dots",

    "Síla záře":"Glow strength", "Doznívání":"Trails",
    "Vizualizéry":"Visualizers", "Equalizér":"Equalizer", "Vlna":"Wave", "Kruh":"Ring",
    "Aktivní vizualizér":"Active visualizer", "Vypnout vizualizér":"Disable visualizer",
    "Viditelnost":"Visibility", "Snímky za sekundu":"Frames per second",
    "Počet sloupců":"Bar count", "Tloušťka čáry":"Line width", "Poloměr":"Radius",
    "Počet paprsků":"Ray count", "Rychlost otáčení":"Rotation speed",
    "Intenzita zvýraznění obrysu pod myší":"Outline glow intensity on hover",
    "Viditelnost záře prvku pod myší. 0 % ponechá pouze původní glow.":"Visibility of the hovered outline. 0% keeps only the original glow.",
    "Pokrytí obrysu září pod myší":"Outline glow coverage on hover",
    "0 % zachová původní dosah, vyšší hodnoty rozšíří záři od kurzoru po obrysu. 100 % rozsvítí celý obrys rovnoměrně. Platí jen pro prvek pod myší; jas určuje Intenzita zvýraznění obrysu pod myší.":"0% keeps the original distance falloff; higher values spread the glow along the outline from the pointer. 100% lights the whole outline evenly. Only the hovered element is affected; Outline glow intensity on hover controls brightness.",
    "Zvýraznění celého obrysu pod myší":"Full outline highlight on hover",
    "Zesílí celý obrys karty nebo tlačítka přímo pod myší. Okolní prvky se nemění. 0 % toto zvýraznění vypne.":"Boosts the entire outline of the card or button directly under the pointer. Nearby elements stay unchanged. Set to 0% to disable.",
    "Dosah záře v ovládacím panelu":"Control Island glow distance",
    "Procento globálního dosahu. 50 % znamená poloviční vzdálenost.":"Percentage of global distance. 50% means half the distance.",
    "Posun odstínu spektrogramu":"Spectrogram hue offset",
    "Zajíždění playlistu":"Playlist slide",
    "Zajíždění živých hodnot":"Live values slide",
    "Zvětšení a zmenšení nastavení":"Settings zoom in and out",
    "Přechody mezi taby":"Tab transitions",
    "Animace rozbalovacích nabídek":"Dropdown animations",
    "Respektovat omezení pohybu systému":"Respect system reduced motion",
    "Barva záře kurzoru":"Pointer glow color",
    "Text kartičky v ovládacím panelu":"Control Island track card text",
    "Zarovnání textu kartičky":"Track card text alignment",
    "Šířka kartičky skladby":"Track card width",
    "Vyplnit volné místo":"Fill available space",
    "Podle názvu a interpreta":"Fit title and artist",
    "Šířka podle textu použije delší z názvu skladby a interpreta. Příliš dlouhý text se zkrátí podle dostupného místa.":"Fit text uses the wider of the track title and artist. Long text is truncated to the available space.",
    "Vzhled prvků panelu při najetí":"Control Island hover appearance",
    "Průhledné":"Transparent",
    "Světlejší":"Lighter",
    "Jemná záře":"Soft glow",
    "Beze změny":"Unchanged",
    "Kartičky a osa":"Cards & timeline",
    "Barvy pozadí":"Background colors",
    "Základní pohyb":"Base motion",
    "Vývojářské / jemné doladění":"Developer / fine tuning",
    "Kartička skladby — nahoře (na obrazovce)":"Track card — top (on screen)",
    "Kartička skladby — dole (ovládací lišta)":"Track card — bottom (control bar)",
    "Časová osa (timeline)":"Timeline",
    "Tvar a rozměry":"Shape and dimensions",
    "Křivka hlasitosti nad ní":"Loudness waveform above the timeline",
    "Živé hodnoty MusicSense":"Live MusicSense values",
    "Aktuální hlasitost, pásma a tempo, jak je aplikace právě měří.":"Current volume, frequency bands and tempo as measured by the app.",
    "Zobrazit i přímo na obrazovce":"Also show on screen",
    "Přidá dvě malé kartičky vedle ovládací lišty, viditelné i se zavřeným nastavením. Zobrazují Bass, Mid, High a Loudness; Tempo a Beat zůstávají pouze zde.":"Adds two small cards beside the control bar, visible even with settings closed. They show Bass, Mid, High and Loudness; Tempo and Beat remain here only.",
    "Pokročilé: křivka odezvy":"Advanced: response curve",
    "Zobrazit horní kartičku":"Show the top card",
    "Kategorie nastavení":"Settings categories",
    "Vyber zdroj MusicSense a citlivost pro každou vlastnost pozadí. Živá hodnota je vidět u mapování. V křivce odezvy dole u každého mapování lze přidat až 3 body a upravit průběh reakce. Vodorovná osa je vstup, svislá výsledná odezva; rohy (0, 0) a (1, 1) jsou pevné.":"Choose a MusicSense source and sensitivity for each background property. Its live value appears beside the mapping. Use the response curve at the bottom of each mapping to add up to 3 points and shape the response. The horizontal axis is the input and the vertical axis is the output; the corners (0, 0) and (1, 1) are fixed.",
    "Přehrávání":"Playback",
    "Import hudby, názvy skladeb a vyrovnaná hlasitost.":"Music imports, track titles and consistent volume.",
    "Vzhled":"Appearance",
    "Písma, barvy, průhlednost a vrstvy pozadí.":"Fonts, colors, opacity and background layers.",
    "Reakce na hudbu":"Music reactivity",
    "Citlivost, mapování MusicSense a jemné doladění pohybu.":"Sensitivity, MusicSense mappings and fine control of motion.",
    "Kartičky a časová osa":"Cards & timeline",
    "Kartičky skladby nahoře i dole a společná nastavení časové osy.":"Top and bottom track cards and all timeline settings together.",
    "Živý zvuk":"Live audio",
    "Aktuální hodnoty MusicSense a zobrazení zvukového spektra.":"Current MusicSense readings and the audio spectrum.",
    "Knihovna a data":"Library & data",
    "Profily skladeb, zálohy a přenos nastavení.":"Track profiles, backups and settings transfer.",
    "Spustit hudbu po importu":"Play music after import",
    "Začít náhodnou skladbou":"Start with a random track",
    "Zpřehlednit názvy skladeb":"Clean up track titles",
    "Srdíčko a obrys reagují na hudbu":"Let the favorite outline follow the music",
    "Zobrazit křivku hlasitosti":"Show the loudness waveform",
    "Křivka zůstává viditelná":"Keep the waveform visible",
    "Vyrovnat hlasitost skladeb":"Match the volume of each track",
    "Cílová hlasitost (LUFS)":"Target volume (LUFS)",
    "Citlivost efektů na hudbu":"Music sensitivity",
    "Animované pozadí":"Animated background",
    "Viditelnost pozadí":"Background opacity",
    "Jemnější záblesky":"Gentler flashes",
    "Klidnější změny barev":"Gentler color changes",
    "Zobrazit hudební spektrum":"Show the music spectrum",
    "Spektrum uvnitř ovládacího panelu":"Spectrum inside Controlpanel",
    "Viditelnost spektra":"Spectrum opacity",
    'Nastavení':'Settings','Přehrávač':'Player','Pozadí':'Background','Spektrogram':'Spectrogram',
    'Obecné':'General','Vrstvy':'Layers','Mapování':'Mapping','Efekty':'Effects',
    'Křivka hlasitosti':'Loudness curve','Ovládací panel':'Control panel','Živé hodnoty':'Live values',
    'Přidat mezi oblíbené':'Add to favorites','Odebrat z oblíbených':'Remove from favorites',
    'Hlasitost (LUFS)':'Loudness (LUFS)','Délka':'Duration','Počet přehrání':'Play count',
    'Naposledy přehráno':'Last played','Normalizace (EBU R128)':'Normalization (EBU R128)',
    'Import a přehrávání':'Import and playback','Automaticky spustit hudbu po přidání souborů':'Automatically play after importing files',
    'Náhodná první skladba':'Random first track','Rozpoznávání názvu a interpreta':'Title and artist recognition',
    'Chytrý režim':'Smart mode','Zapnuto (výchozí)':'On (default)','Vypnuto':'Off',
    'Znovu rozpoznat názvy v playlistu':'Re-detect playlist titles','Vzhled UI':'UI appearance',
    'Jazyk':'Language','Font rozhraní (běžný text)':'Interface font (body text)','Font nadpisů':'Heading font',
    'Font čísel/monospace':'Numbers/monospace font','Průhlednost panelů':'Panel opacity','Výkon':'Performance',
    'Barvy přehrávače':'Player colors','Synchronizovat s "Rychlost změny spektra"':'Sync with “Spectrum color speed”',
    'Náhledy skladeb v playlistu':'Playlist track thumbnails','Play/Pause tlačítko':'Play/Pause button',
    'Ikona ozubeného kolečka':'Gear icon','Scanlina normalizace (playlist)':'Normalization scanline (playlist)',
    'vlastní barva 1':'custom color 1','vlastní barva 2':'custom color 2',
    'Timeline island — rozměry a tvar':'Timeline island — size and shape','Spojený vzhled s ovládací lištou':'Merged appearance with control bar',
    'Výška panelu':'Panel height','Mezera od hlavní lišty':'Gap from main bar','Zúžení oproti hlavní liště':'Inset from main bar',
    'Zapuštění pod hlavní lištu':'Overlap under main bar','Ukazatel času u timeline':'Timeline time display',
    'Ukazatel času':'Time display','Síla wave efektu':'Wave effect strength','Šířka wave efektu (sigma)':'Wave effect width (sigma)',
    'Symetrická vlna':'Symmetric wave','Křivka hlasitosti (jako YouTube)':'Loudness curve (YouTube style)',
    'Odstín':'Hue','Sytost':'Saturation','Světlost':'Lightness','Neprůhlednost':'Opacity','Animace rozhraní':'Interface animations','Animace nastavení':'Settings animations','Délka animace':'Animation duration','Neprůhlednost obrysu':'Outline opacity','Obrys ovládacího panelu':'Control panel outline','Barva obrysu':'Outline color','Tloušťka obrysu':'Outline width','Zjemnění okrajů':'Edge fades','Výška křivky':'Curve height','Síla (měřítko na ose Y)':'Strength (Y-axis scale)',
    'Odstup křivky od lišty':'Curve offset from bar','Vyhlazení křivky (živě)':'Curve smoothing (live)',
    'Hustota vzorků (analýza)':'Sample density (analysis)','Pozadí prvků ovládací lišty':'Control-bar element backgrounds',
    'Zapnuto':'On','Tmavost pozadí':'Background darkness','Blur pozadí':'Background blur','Zaoblení rohů':'Corner radius',
    'Čas v ovládací liště':'Time in control bar','Název skladby v ovládací liště':'Track title in control bar',
    'Zobrazit název skladby':'Show track title','Červený obrys jen při hoveru':'Red outline only on hover',
    'Název skladby na obrazovce (vlevo nahoře)':'On-screen track title (top left)',
    'Pulzování obrysu podle hudby':'Pulse outline with music','Práh (floor)':'Threshold (floor)',
    'Živé hodnoty na obrazovce':'On-screen live values','Zobrazit panel nad ovládací lištou':'Show panel above control bar',
    'Normalizace hlasitosti':'Loudness normalization','Cíl':'Target','Cílové LUFS':'Target LUFS',
    'Citlivost pásem':'Band sensitivity','Dělitel citlivosti (globální)':'Sensitivity divisor (global)',
    'Analýza':'Analysis','FFT velikost':'FFT size','Vyhlazení hodnot':'Value smoothing','Střední':'Medium',
    'Uložené profily':'Saved profiles','Analyzováno skladeb':'Analyzed tracks','Cachovat křivku hlasitosti (waveform)':'Cache loudness curve (waveform)',
    'Celé nastavení (vše)':'Full settings (all)','Reaktivní pozadí':'Reactive background','Rychlost driftu (základ)':'Drift speed (base)',
    'Mapování MusicSense → pozadí':'MusicSense → background mapping','Velikost teček':'Dot size','Rychlost pohybu':'Movement speed',
    'Flashování (jas)':'Flash (brightness)','Rychlost změny spektra':'Spectrum color speed','Rozostření':'Blur',
    'Barevné korekce':'Color correction','Otočení odstínu (hue)':'Hue rotation','Sparkles (třpytky)':'Sparkles',
    'Hustota':'Density','Velikost':'Size','Délka života':'Lifetime','Zrcadlení (Mirror)':'Mirroring (Mirror)',
    'Zrcadlení 2 (Mirror 2)':'Mirroring 2 (Mirror 2)','Síla zrcadla':'Mirror strength','Obě (4 kvadranty)':'Both (4 quadrants)',
    'Horizontální (zrcadlo vlevo/vpravo)':'Horizontal (mirror left/right)','Vertikální (zrcadlo nahoře/dole)':'Vertical (mirror top/bottom)',
    'Spouštěj na Flash (beat)':'Trigger on Flash (beat)','Frekvence záseků':'Glitch frequency','Doba trvání záseku':'Glitch duration',
    'Síla posunu pruhů':'Slice shift strength','Viněta (ztmavení okrajů)':'Vignette (darken edges)',
    'Celková viditelnost pozadí':'Overall background visibility','Rozměry & rychlost':'Size & speed',
    'Umístění':'Placement','Výška pruhu':'Band height','Jen uvnitř ovládacího panelu':'Only inside control panel',
    'Vyplnit celou šířku':'Fill full width','Roztažení (px/s)':'Scale (px/s)','Pozice "teď" (playhead)':'“Now” position (playhead)',
    'Uprostřed obrazovky/panelu':'Center of screen/panel','Symetrické vykreslování':'Symmetric rendering',
    'Playhead zarovnaná ke konci playlistu':'Align playhead to playlist edge','Frekvenční rozsah':'Frequency range',
    'Min. frekvence':'Min. frequency','Max. frekvence':'Max. frequency','Logaritmická osa Y':'Logarithmic Y axis',
    'Citlivost & vyhlazení':'Sensitivity & smoothing','Zesílení intenzity':'Intensity gain','Gamma (kontrast)':'Gamma (contrast)',
    'Celkové rozostření':'Overall blur','Rozostření okraje historie':'History edge fade','Zleva (nejstarší data)':'From left (oldest data)',
    'Zprava':'From right','Síla horního/spodního rozostření':'Top/bottom edge fade strength','Nahoře':'Top','Dole':'Bottom',
    'Barvy':'Colors','Paleta':'Palette','Barvy přehrávače (gradient)':'Player colors (gradient)',
    'Heatmapa (modrá → fialová → růžová → žlutá)':'Heatmap (blue → purple → pink → yellow)',
    'Ovládací panel nad spektrogramem':'Control panel over spectrogram','Sklo efekt (warp pod panelem)':'Glass effect (warp under panel)',
    'Průhlednost panelu (sklo)':'Panel opacity (glass)','Blur panelu (sklo)':'Panel blur (glass)',
    'Síla záře za panelem':'Glow strength behind panel','Viditelnost spektrogramu ve skle':'Spectrogram visibility through glass',
    'Obnovit výchozí nastavení':'Restore default settings','Vybrat MP3 soubory':'Select MP3 files','Vybrat složku':'Select folder',
    'Analyzuji hlasitost…':'Analyzing loudness…','Předchozí':'Previous','Přehrát':'Play','Další':'Next',
    'Ztlumit':'Mute','Zapnout zvuk':'Unmute','Náhodné přehrávání':'Shuffle','Opakovat playlist':'Repeat playlist',
    'Nic nehraje':'Nothing playing','Vyber skladbu z playlistu':'Select a track from the playlist',
    'soubory':'files','složka':'folder','Hledat ve skladbách...':'Search tracks...','Vymazat hledání':'Clear search',
    'Zatím žádné skladby.':'No tracks yet.','Nahraj MP3 soubory nebo přetáhni je sem.':'Add MP3 files or drag them here.',
    'Analyzovat vše':'Analyze all','Analyzuji…':'Analyzing…','Zastavit analýzu':'Stop analysis','Vše už je analyzováno':'Everything is already analyzed',
    'Neznámý interpret':'Unknown artist','Neanalyzováno':'Not analyzed','Zatím nikdy':'Never','Nic nenalezeno.':'Nothing found.',
    'Kopírovat':'Copy','Vložit':'Paste','Zkopírováno':'Copied','Nic ke vložení':'Nothing to paste',
    'Rotace odstínu (duha, dle hudby)':'Hue rotation (rainbow, music-driven)','Barva přehrávače':'Player color','Vlastní barva':'Custom color',
    'vlastní barva vrstvy':'custom layer color','Křivka odezvy':'Response curve','Klikni = přidej bod (max 3)':'Click = add point (max 3)',
    'Tažení = posun':'Drag = move','Normalizace na vlastní rozsah':'Normalize to custom range','Clamp na vlastní rozsah':'Clamp to custom range',
    'Práh spuštění':'Trigger threshold','Síla boostu':'Boost strength','Vyhlazení':'Smoothing','Živě':'Live',
    'Násobitel při min BPM':'Multiplier at min BPM','Násobitel při max BPM':'Multiplier at max BPM',
    'Náhodně (drift)':'Random (drift)','Padání shora':'Falling from top','Z okrajů do středu':'From edges to center','Čtverec':'Square',
    'Celkem teček na obrazovce':'Total dots on screen','Přetáhni MP3 soubory sem':'Drop MP3 files here',
    'nebo sem přetáhni MP3 soubory / složku':'or drag MP3 files / a folder here',
    'Přehrávač s automatickou normalizací hlasitosti (EBU R128) a živou hudební analýzou. Nahraj MP3 soubory nebo vyber celou složku a začni přehrávat.':'A music player with automatic loudness normalization (EBU R128) and live music analysis. Add MP3 files or select a folder to start listening.',
    'Jak se z názvu souboru odhaduje interpret a název skladby (ID3 tagy se nečtou).':'Controls how the artist and track title are inferred from the filename (ID3 tags are not read).',
    'Nižší hodnota = panely (nastavení, playlist, ovládací lišta) jsou průhlednější a víc prosvítá pozadí za nimi.':'Lower values make the settings, playlist, and control-bar panels more transparent.',
    'Každá skladba se před přehráním analyzuje a doladí na cílovou hlasitost.':'Each track is analyzed and adjusted to the target loudness before playback.',
    'Standard streamovacích služeb je -14 LUFS.':'A common streaming-service target is -14 LUFS.',
    'Profily hlasitosti (LUFS) se ukládají v prohlížeči (localStorage) podle přesného názvu souboru. Přetrvávají mezi relacemi.':'Loudness (LUFS) profiles are stored in browser localStorage under the exact filename and persist between sessions.',
    'Exportuje/importuje úplně všechno: vrstvy pozadí, tvary, MusicSense mapování, křivky, citlivosti, barvy — celý stav aplikace v jednom JSON souboru. Profily hlasitosti (LUFS) se exportují zvlášť výše.':'Exports or imports the complete app state—background layers, shapes, MusicSense mappings, curves, sensitivity, and colors—in one JSON file. Loudness profiles are handled separately above.',
    'Měkké tvary na pozadí, poskládané z až 4 nezávislých vrstev. Na startu stojí na místě — hýbat, zvětšovat a probleskovat se začnou podle namapovaných MusicSense hodnot níže.':'Soft background shapes arranged in up to four independent layers. Their movement, size, and flashes react to the mapped MusicSense values below.',
    'Sdílené všemi vrstvami.':'Shared by all layers.','Finální násobič viditelnosti úplně všeho na pozadí — vrstev, zrcadla i efektů.':'Final visibility multiplier for every background layer, mirror, and effect.',
    'Realtime waterfall — jen historie skladby, doleva od "teď". Žádná predikce budoucnosti, playhead je vždy úplně vpravo (na "teď").':'Real-time waterfall showing only past audio to the left of “now”; it does not predict future audio.',
    'Heatmapa dává nejlepší kontrast a čitelnost pro rychlé pasáže. Gradient přehrávače ladí barevně s UI, ale je hůř čitelný u hustšího spektra.':'The heatmap provides the clearest contrast for fast passages. The player gradient matches the UI but can be harder to read in dense spectra.',
    'Import se nezdařil: soubor není platný JSON export profilů.':'Import failed: the file is not a valid profile JSON export.',
    'Import se nezdařil: soubor není platný JSON export nastavení.':'Import failed: the file is not a valid settings JSON export.',
    'Neplatný formát souboru':'Invalid file format','Nastavení importováno':'Settings imported',
    '= před rozdělením na " - " se automaticky odstraní čísla skladeb (01., 02 -…) a šumové přívěsky (Official MV, Lyrics Video, HD…). Pro YouTube-style názvy s názvy v uvozovkách jako':'= automatically removes track numbers (01., 02 -…) and noise suffixes (Official MV, Lyrics Video, HD…) before splitting on “ - ”. A separate rule handles YouTube-style quoted titles such as',
    '= původní chování — čistý split na první " - ", nic víc.':'= original behavior—a simple split on the first “ - ” and nothing else.',
    'funguje samostatné pravidlo. Záložní heuristiky zvládají i podtržítka a závorky na konci.':'uses a dedicated rule. Fallback heuristics also handle underscores and trailing parentheses.',
    'Interpret \'Písnička\'':'Artist \'Song\'',
    'Aplikuje se jako poslední, nad rámec všeho výše (vrstvy, zrcadlo, glitch, viněta, scanlines).':'Applied last, on top of every layer, mirror, glitch, vignette, and scanline effect above.',
    'Aplikuje se na CELÉ pozadí (všechny vrstvy najednou) jako poslední krok, nad rámec vrstev a mapování výše.':'Applied to the entire background—all layers together—as the final step after the layer and mapping controls above.',
    'Barva alba/tečky skladby, timeline a ikony ozubeného kolečka. Nezávislé na barvách pozadí.':'Controls the album/track dot, timeline, and gear-icon colors independently of the background colors.',
    'Barvy (použity, když je "Rychlost změny spektra" vypnutá)':'Colors (used when “Spectrum color speed” is off)',
    'Bílá křivka nad timeline podle normalizované hlasitosti skladby — podobně jako "most replayed" na YouTube. Zobrazí se při najetí myší na timeline. Spočítá se automaticky při přehrání nebo analýze.':'A white curve above the timeline based on normalized track loudness, similar to YouTube’s “most replayed” curve. It appears on hover and is calculated during playback or analysis.',
    'Celková výška waterfall pruhu (max velikost na ose Y), centrovaná na střed ovládacího panelu. Ignorováno, když je zapnuté "Jen uvnitř ovládacího panelu" — tam výška odpovídá panelu.':'Overall waterfall-band height (maximum Y-axis size), centered on the control panel. Ignored in “Only inside control panel” mode, where the panel defines the height.',
    'Definuje, jaký rozsah dBFS se mapuje na 0–100 % ukazatele Loudness.':'Defines the dBFS range mapped to 0–100% on the Loudness meter.',
    'Efekty pozadí (post-processing)':'Background effects (post-processing)',
    'Hlavní páka nad vším ostatním — násobí všechna pásma najednou.':'Master control that multiplies all frequency bands at once.',
    'Hlavní vypínač pro celý efekt třpytek. Které konkrétní vrstvy je skutečně vyzařují se nastavuje zvlášť v gear panelu dané vrstvy.':'Master switch for sparkles. Choose which layers emit them in each layer’s gear panel.',
    'Hodnota zdroje pod tímto prahem = obrys úplně nesvítí (0 %), 100 % zdroje = plná záře. Hlasitost/pásma se u normální hudby drží dost vysoko, takže bez posunutí prahu nahoru efekt vypadá skoro pořád "zapnutý na max" — zvyš práh, pokud chceš, aby obrys reagoval jen na výraznější momenty.':'Below this source threshold the outline does not glow; a 100% source produces full glow. Raise the threshold if the outline looks permanently maxed and should react only to stronger moments.',
    'Jak dlouho jedna třpytka žije, než úplně zhasne.':'How long each sparkle remains visible before fading out.',
    'Jak rychle stopa (trail) mizí mezi snímky — sdíleno všemi vrstvami, které mají Trail zapnutý (přepínač je v gear panelu dané vrstvy). Nižší = dlouho doznívající ocásky, vyšší = krátké čárky.':'How quickly trails fade between frames. Shared by all layers with Trail enabled. Lower values produce long tails; higher values produce short streaks.',
    'Jak rychle waterfall ujíždí = kolik pixelů odpovídá jedné sekundě hudby. Vyšší = rychlejší posun a vidíš méně sekund najednou, ale detailněji.':'How many pixels represent one second of audio. Higher values scroll more slowly and show fewer seconds with greater detail.',
    'Jak vysoko křivka sahá nad progress bar. 1× = výchozí, vyšší = výraznější.':'How high the curve extends above the progress bar. 1× is the default; higher values are more pronounced.',
    'Jemné vodorovné linky přes celé pozadí, jako starý CRT monitor.':'Subtle horizontal lines across the background, like an old CRT display.',
    'Jemný blur přes celý waterfall, aby vodorovné pruhy a hrany mezi sloupci nebyly tak ostré/pixelové a obraz působil hladčeji.':'Applies a soft blur to the waterfall so bands and column edges look smoother and less pixelated.',
    'Každá vrstva je samostatná sada teček s vlastním tvarem, počtem, velikostí a rozostřením — jako průsvitné fólie nad sebou. Všechny vrstvy sdílí stejné MusicSense mapování níže, ale ozubené kolečko u vrstvy nastaví, jak moc na něj ta vrstva reaguje.':'Each layer is an independent set of dots with its own shape, count, size, and blur. Layers share the MusicSense mappings below, while each layer’s gear controls its response strength.',
    'Kde na pruhu sedí aktuální okamžik ("teď"). Vpravo = klasický waterfall, historie jede zprava doleva přes celou šířku. Uprostřed = "teď" je vždy na středu pruhu.':'Sets where “now” appears. Right creates a classic right-to-left waterfall; Center keeps the playhead in the middle.',
    'Vyber zdroj MusicSense a citlivost pro každou vlastnost pozadí. Živá hodnota je vidět u mapování. V křivce odezvy dole u každého mapování lze přidat až 3 body a upravit průběh reakce. Vodorovná osa je vstup, svislá výsledná odezva; rohy (0, 0) a (1, 1) jsou pevné.':'Choose which live MusicSense value controls each visual property and how strongly. The response curve changes the reaction shape: above 1.0×, low values have little effect until the source nears 100%; below 1.0×, even modest values react strongly and flatten near the top.',
    'Klidová rychlost pohybu, na kterou se přičítá mapovaná hodnota níže. Na 0 tvary stojí, dokud je hudba nerozhýbe.':'Base idle movement speed before the mapped value is added. At zero, shapes stay still until the music moves them.',
    'Kolik hodnot hlasitosti za vteřinu se zaznamená při analýze skladby — víc vzorků = detailnější/členitější křivka, míň = hrubší. Projeví se jen na NOVĚ analyzovaných skladbách; už uložené profily si drží svou starou křivku, dokud se skladba znovu neanalyzuje (např. po vymazání uložených dat prohlížeče pro tuto stránku).':'Number of loudness samples recorded per second during analysis. More samples produce a more detailed curve. This affects only newly analyzed tracks; saved profiles keep their existing curves until re-analyzed.',
    'Kolik sekund minulosti zůstává na obrazovce vlevo od "teď" (playhead), než zmizí za okrajem.':'How many seconds of history remain visible to the left of the playhead before leaving the screen.',
    'Kolik třpytek za sekundu se přibližně vytváří. Automaticky se dočasně zvýší při hlasitějších/energičtějších momentech (Flash).':'Approximate sparkle spawn rate per second. It temporarily increases during louder, more energetic Flash moments.',
    'Mezera mezi spodním okrajem křivky a samotnou timeline lištou pod ní. Záporná hodnota posune křivku dolů, klidně až přes/pod lištu.':'Gap between the bottom of the curve and the timeline bar. Negative values move the curve down across or below the bar.',
    'Nezávisle na Výšce křivky škáluje tvar samotné křivky — nižší hodnoty = plošší, decentnější tvar, vyšší = tišší pasáže vypadají výrazněji hlasitě.':'Scales the curve shape independently of Curve height. Lower values look flatter; higher values emphasize quieter passages.',
    'Nezávislé na rozostření okraje historie výše — jen zjemní horní a/nebo spodní hranu pruhu, ať už zapneš cokoliv z toho níže.':'Independent of the history-edge fade above; softens only the top and/or bottom edge selected below.',
    'Nezávislý druhý mirror efekt — funguje stejně jako Mirror výše, jen s vlastní osou a silou. Lze kombinovat s prvním mirrorem najednou (např. Mirror 1 = X, Mirror 2 = Y pro efekt 4 kvadrantů se dvěma různými sílami).':'A second independent mirror with its own axis and strength. Combine it with Mirror 1, for example X plus Y, to create four quadrants with different strengths.',
    'Nižší = úzký ostrý hrb pod kurzorem, vyšší = široká plynulá vlna přes velkou část lišty.':'Lower values create a narrow sharp bump; higher values create a broad smooth wave.',
    'O kolik pixelů (na každou stranu) je timeline užší než hlavní ovládací lišta pod ní. 0 = stejně široká.':'How many pixels narrower the timeline is on each side than the main control bar. Zero means equal width.',
    'O kolik pixelů timeline zajíždí POD horní okraj hlavní lišty, aby mezi nimi nezůstala žádná mezera/díra ani při zaoblených rozích. Vyšší hodnota = víc se schová, jistější spojení.':'How far the timeline overlaps under the main bar to prevent a gap between rounded corners. Higher values create a stronger overlap.',
    'Průhlednost odraženého obrazu — 100 % = plné zrcadlo, méně = jemný duch navíc.':'Opacity of the reflected image. 100% is a full mirror; lower values add a subtle ghost.',
    'Průhlednost samotného waterfallu, jak prosvítá skrz sklo panelu (nezávisle na Průhlednosti/Blur panelu výše). Nižší = waterfall skrz sklo jen náznakem, vyšší = plně viditelný.':'Opacity of the waterfall through the glass, independent of panel opacity and blur. Lower values are subtle; higher values are fully visible.',
    'Přeparsuje všechny již načtené soubory v playlistu (= aplikuje aktuální nastavení na stávající seznam). Soubory to nepřenačte, jen aktualizuje zobrazené jméno/interpreta.':'Reprocesses all loaded playlist filenames using the current recognition settings. It does not reload files; it only updates displayed titles and artists.',
    'Přidá dvě malé kartičky po stranách ovládací lišty — vlevo Bass a High, vpravo Mid a Loudness. Stejné hodnoty jako v Nastavení → Audio → Živé hodnoty, ale vidíš je i bez otevřeného nastavení. Tempo a Beat se sem nepřidávají.':'Adds small cards beside the control bar: Bass and High on the left, Mid and Loudness on the right. They mirror Settings → Audio → Live values without requiring Settings to stay open.',
    'Rychlost blednutí stopy (Trail)':'Trail fade speed',
    'Timeline (progress bar) je samostatný plovoucí panel nad hlavní ovládací lištou — stejné sklo/materiál, včetně efektu spektrogramu prosvítajícího skrz, když je zapnutý.':'The timeline is a separate floating panel above the main control bar, using the same glass material and optional spectrogram-through-glass effect.',
    'Tmavá "podložka" za tlačítky, časem, hlasitostí, progress barem a názvem skladby v ovládací liště — drží text a ovládání čitelné i když skrz sklo prosvítá spektrogram.':'A dark backing behind controls, time, volume, progress, and track title that keeps them readable over the glass spectrogram.',
    'Vyhlazuje Loudness, Bass, Mid a High. Nižší = pomalejší, plynulejší reakce. 100 % = bez vyhlazení, syrová hodnota.':'Smooths Loudness, Bass, Mid, and High. Lower values react more slowly and smoothly; 100% is raw with no smoothing.',
    'Vyhlazuje tvar křivky při vykreslování — funguje okamžitě na už uložených datech, žádná skladba se nemusí přeanalyzovat. 0 = syrový, hranatější tvar; vyšší = plynulejší, zaoblenější.':'Smooths the curve while drawing and applies immediately to saved data without re-analysis. Zero is raw and angular; higher values are smoother and rounder.',
    'Vynechat ze synchronizace (zůstanou na pevných barvách níže, i když je sync zapnutá):':'Exclude from synchronization so these items keep their fixed colors:',
    'Vypnuto = waterfall se kreslí jen v hlavní ovládací liště, ne znovu i v samostatném timeline panelu nad ní — ušetří to vykreslování stejných dat podruhé, když ho tam beztak nepotřebuješ.':'Off draws the waterfall only in the main control bar, avoiding a duplicate render in the timeline panel.',
    'Vypnutím schováš celou kartičku s názvem/interpretem (i srdíčko a rozklikávací info) vlevo nahoře nad pozadím.':'Turn off to hide the entire top-left title/artist card, including favorite and details controls.',
    'Vypnutím schováš celou kartičku s názvem/interpretem (i srdíčko a rozklikávací info) z hlavní ovládací lišty.':'Turn off to hide the entire title/artist card in the main control bar, including favorite and details controls.',
    'Vyšší = potlačí slabý šum a jen skutečně silná místa svítí (čitelnější). Nižší = i slabá pásma jasně vidět, ale obraz je vycpanější a méně čitelný.':'Higher values suppress weak noise so only strong areas glow. Lower values reveal weaker bands but create a denser image.',
    'Všechny citlivosti níže se dělí touto hodnotou, než ovlivní pozadí. Vyšší dělitel = jemnější (méně citlivá) reakce na hudbu.':'All sensitivities below are divided by this value before affecting the background. A higher divisor creates a gentler response.',
    'Zapnuto (výchozí) = jakmile do prázdného playlistu přidáš první soubory/složku, hned se spustí přehrávání. Vypnuto = soubory se jen přidají a vyberou, přehrávání spustíš ručně tlačítkem Play.':'On starts playback when files first enter an empty playlist. Off only adds and selects them until you press Play.',
    'Zapnuto (výchozí) = per-second data křivky hlasitosti se ukládají do localStorage spolu s LUFS profilem — méně dat na přepočet, ale větší localStorage. Vypnuto = křivka se počítá real-time při každém přehrání a nikam se neukládá (LUFS profil se ukládá stále).':'On stores per-second waveform data with the LUFS profile, reducing recalculation at the cost of more localStorage. Off calculates the curve during playback without saving it; LUFS profiles are still saved.',
    'Zapnuto (výchozí) = při aktivním scrollování (playlist, nastavení) nebo tažení slideru se vynechává každý druhý snímek vykreslení pozadí (bloby, spektrogram, barvy přehrávače) — uvolní to hlavní vlákno pro plynulejší samotný scroll. Vypnuto = pozadí se vždy vykresluje na plný snímkovací výkon i během scrollování, i za cenu možného trhání scrollu samotného na slabším hardwaru.':'On skips every other background frame while scrolling or dragging to keep controls smoother. Off always renders the background at full frame rate, which may stutter on weaker hardware.',
    'Zapnuto = "teď" (playhead) se zarovná přesně tam, kde končí panel playlistu (když je otevřený) — waterfall pak jede vlevo od playlistu, ne pod ním schovaný. Když je playlist zavřený, playhead se automaticky posune k pravému okraji celé obrazovky. Ignorováno, když je "Pozice teď" nastavena na Uprostřed.':'On aligns “now” with the open playlist edge so the waterfall remains visible to its left. When the playlist closes, the playhead returns to the screen edge. Ignored when Now position is Center.',
    'Zapnuto = barvy přehrávače se plynule mění společně s barvami blobů na pozadí (řízeno mapováním "Rychlost změny spektra" v kategorii Reakce na hudbu). Vypnuto = pevné barvy níže.':'On makes player colors follow the background blob colors using Background → Spectrum color speed. Off uses the fixed colors below.',
    'Zapnuto = basy zabírají větší část výšky pruhu (jako u skutečných spektrogramů/sluchu), vypnuto = lineární rozestup frekvencí.':'On gives bass more vertical space, like real spectrograms and human hearing. Off uses linear frequency spacing.',
    'Zapnuto = glitch se soustředí kolem hudebních flashů/beatů místo čistě náhodného časování. Každý zásek posune několik vodorovných pruhů obrazu do strany a rozdělí barevné kanály — jako výpadek signálu, ne jen barevné vločky.':'On biases glitch bursts toward music flashes and beats. Each burst shifts horizontal image slices and separates color channels like a signal fault.',
    'Zapnuto = historie automaticky pokryje celou dostupnou šířku pruhu/panelu (spočítáno ze skutečné šířky a Roztažení px/s), takže waterfall vyplní obrazovku od kraje ke kraji místo aby zůstal prázdný pruh vlevo. Vypnuto = použije se pevná délka historie nastavená níže.':'On automatically fills the available width using the actual panel size and px/s scale. Off uses the fixed history duration below.',
    'Zapnuto = historie se navíc zrcadlově vykresluje i na druhou stranu od "teď" (hezké při pozici uprostřed). Vypnuto = historie jede jen jedním směrem (doleva od "teď"), jako klasický waterfall.':'On mirrors history to both sides of “now”, especially useful with a centered playhead. Off runs only leftward like a classic waterfall.',
    'Zapnuto = křivka je vidět pořád, i bez najetí myší na timeline. Vypnuto (výchozí) = křivka se objeví jen při hoveru a jinak zůstává skrytá.':'On keeps the curve visible at all times. Off shows it only while hovering over the timeline.',
    'Zapnuto = ovládací panel zprůhlední a ztlumí svůj blur, takže waterfall skrz něj viditelně prosvítá jako přes matné sklo, navíc s jemnou zářící "kompresní" linkou přesně za panelem — jako by ho tam hudba protlačovala.':'On makes the panel more transparent with softer blur so the waterfall shows through frosted glass, plus a subtle compression glow behind it.',
    'Zapnuto = při prvním naplnění prázdného playlistu se místo skladby č. 1 vybere náhodná skladba. Netýká se dalšího přidávání souborů do už rozehraného playlistu.':'On selects a random track instead of track 1 when an empty playlist is first filled. Later additions are unaffected.',
    'Zapnuto = síla záře červeného obrysu (u oblíbené skladby) živě pulzuje podle vybrané hodnoty z MusicSense místo pevné statické záře.':'On makes the favorite-track red outline pulse with the selected MusicSense value instead of using a static glow.',
    'Zapnuto = timeline panel je mírně užší, bez mezery a se čtvercovými spodními rohy, takže vizuálně splývá s hlavní lištou pod ním. Vypnuto = původní vzhled — timeline stejně široká jako lišta, plně zaoblená, s mezerou nastavitelnou níže.':'On makes the timeline slightly narrower with no gap and square bottom corners so it merges into the main bar. Off restores equal width, rounded corners, and an adjustable gap.',
    'Zapnuto = vlna se zvedá stejně na obě strany od kurzoru. Vypnuto (výchozí) = vlna reaguje jen směrem doprava od kurzoru.':'On raises the wave equally on both sides of the cursor. Off reacts only to the right.',
    'Zapnuto = vydělí dvěma výsledek mapování "Flashování (jas)" — sdíleného i jakéhokoliv per-vrstva override — takže probleskování je citelně mírnější.':'On halves the Flash mapping result, including layer overrides, for gentler brightness changes.',
    'Zapnuto = vydělí dvěma výsledek mapování "Rychlost změny spektra" — sdíleného i jakéhokoliv per-vrstva override v režimu "Rotace odstínu" — takže míhání barev je citelně mírnější. Nemá vliv na vrstvy s override v režimu "Barva přehrávače"/"Vlastní barva", ty se stejně nerotují.':'On halves the Spectrum color speed result, including hue-rotation layer overrides, for gentler color motion. Player-color and custom-color layers are unaffected.',
    'Zapnuto = waterfall se vykresluje POUZE uvnitř skleněného ovládacího panelu (nesahá přes celou obrazovku) — panel funguje jako okno do spektrogramu. Vypnuto = pruh přes celou šířku obrazovky (výchozí chování).':'On renders the waterfall only inside the glass control panel. Off renders a full-width band across the screen.',
    'Zapnuto = červený obrys oblíbené skladby kolem kartičky se objeví jen když na ni najedeš myší. Vypnuto (výchozí) = obrys je vidět trvale, dokud je skladba oblíbená.':'On shows the favorite-track red outline only on hover. Off keeps it visible while the track is favorited.',
    'Zapnuto = červený obrys oblíbené skladby kolem této kartičky se objeví jen když na ni najedeš myší. Vypnuto (výchozí) = obrys je vidět trvale, dokud je skladba oblíbená.':'On shows this favorite-track red outline only on hover. Off keeps it visible while the track is favorited.',
    'Zapíná/vypíná ukazatel času v hlavní ovládací liště — nezávisle na ukazateli u timeline v sekci Časová osa.':'Toggles the time display in the main control bar independently of the timeline time display.',
    'Zjemní ostrý přechod na okraji dat waterfallu — místo tvrdého konce dat plynule dozní do průhledna. Které straně(ám) se to aplikuje, vyber přepínači níže.':'Softens the waterfall data edge so it fades to transparency instead of ending abruptly. Choose the affected sides below.',
    'Zobrazí čas přímo vedle timeline panelu (mimo panel, ne přes něj), nezávisle na ukazateli času v hlavní ovládací liště.':'Shows time beside the timeline panel independently of the time display in the main control bar.',
    'Čára pod kurzorem se vlní nahoru jako gaussova křivka. Vypnutí vrátí klasickou plochou lištu.':'Makes the line rise under the cursor as a Gaussian wave. Turn it off for a classic flat bar.',
    'Čeština':'Czech','Tvar':'Shape','Rotace':'Rotation','Vypnout vrstvu':'Disable layer',
    'Nastavení vrstvy':'Layer settings','Vlastní dráha pohybu':'Custom motion path','Boční kývání':'Side sway',
    'Žádné skladby k přeparsování.':'No tracks to re-detect.',
    'Počet teček':'Dot count','Automatické houpání rotace':'Automatic rotation sway','Základní jas':'Base brightness',
    'Míra rozostření':'Blur amount','Celková viditelnost vrstvy':'Overall layer visibility',
    'Citlivost na MusicSense':'MusicSense sensitivity','Zrcadlit tuto vrstvu (Mirror post-processing)':'Mirror this layer (post-processing)',
    'Trail (stopa)':'Trail','Délka stopy':'Trail length','Velikost stop (násobič)':'Trail size multiplier',
    'Zapnuto pro tuto vrstvu':'Enabled for this layer','Sparkles (třpytky)':'Sparkles',
    'Beat cut (ztmavení na beat)':'Beat cut (darken on beat)','Práh hlasitosti':'Loudness threshold',
    'Doba držení před spuštěním':'Sustain time before triggering','Tmavost střihu':'Cut darkness',
    'Délka jednoho střihu':'Single-cut duration','Min. jistota tempa pro sync na beat':'Minimum tempo confidence for beat sync',
    'Záložní tempo (bez jistoty beatu)':'Fallback tempo (without beat confidence)',
    'Vlastní mapování (override)':'Custom mapping (override)','Kopírovat křivku':'Copy curve',
    'Vložit křivku':'Paste curve','Reset na lineární':'Reset to linear','Beat fáze (0-1)':'Beat phase (0-1)',
    'Orbit kolem středu':'Orbit around center','Ze středu ven':'From center outward','Zdola nahoru':'Rising from bottom',
    'Zprava doleva':'Right to left','Zleva doprava':'Left to right','Organický':'Organic','Hvězda':'Star',
    'Sync rychlosti změny barvy s tempem (BPM)':'Sync color-change speed with tempo (BPM)',
    'Celková viditelnost vrstvy':'Overall layer visibility',
    'Určuje TVAR pohybu teček — náhodný drift, plynulý tok jedním směrem, nebo pohyb do/ze středu. Rychlost pohybu pořád řídí Rychlost driftu + mapování Rychlost pohybu níže. Vypnuto = původní volný náhodný pohyb (výchozí).':'Selects the dot motion pattern: random drift, directional flow, or movement toward or away from the center. Speed is still controlled by Drift speed plus the Movement speed mapping below. Off keeps the original free random movement.',
    'Jak moc se tečky kolébají do stran napříč směrem pohybu (kolmo na dráhu "Padání shora"/"Zdola nahoru"/"Zprava doleva"/"Zleva doprava"). 0 % = dokonale rovná dráha bez kolébání. Nesouvisí s "Automatické houpání rotace" výše, které otáčí tvarem, ne jeho pozicí.':'Controls how far dots sway sideways across their direction of travel. 0% produces a perfectly straight path. This is separate from Automatic rotation sway, which rotates the shape rather than moving it.',
    'Vypnuto (výchozí) = rotace je pevně na hodnotě ze slideru výše. Zapnuto = tečky se navíc jemně houpou ±8° kolem této hodnoty, rychlostí odvozenou z aktuálního driftu/rychlosti vrstvy.':'Off keeps rotation fixed at the slider value. On gently sways dots ±8° around that value at a speed derived from the current layer movement.',
    'Zaoblí ostré hrany a rohy tvaru (funguje i na vnitřní zářezy u crosshairu). 0 % = původní ostré hrany, 100 % = maximální zaoblení.':'Rounds sharp shape edges and corners, including inner crosshair notches. 0% keeps sharp edges; 100% applies maximum rounding.',
    'Finální násobič viditelnosti celé vrstvy, navrch Základního jasu i flashování. Na 0 % je vrstva neviditelná, ale zůstává nakonfigurovaná — vhodné na dočasné schování vrstvy.':'Final visibility multiplier applied after Base brightness and flashing. At 0% the layer is hidden but remains configured.',
    'Násobí, jak silně tuto vrstvu ovlivňují sdílená mapování Velikost/Rychlost/Flash/Blur níže. Na 0 % vrstva na hudbu vůbec nereaguje, jen sedí na místě dle Základního jasu. Nemá vliv na cíle, které mají níže zapnutý vlastní Override — ty mají vlastní citlivost.':'Scales how strongly the shared Size, Speed, Flash, and Blur mappings affect this layer. At 0% the layer does not react to music. Targets with their own override use their own sensitivity.',
    'Vypnuto = tato vrstva se nikdy nezrcadlí, i když je globální efekt "Zrcadlení (Mirror)" v Efektech pozadí zapnutý pro zbytek pozadí.':'Off prevents this layer from being mirrored even when the global Mirror effect is enabled for the rest of the background.',
    '100 % = ghost kopie mají stejnou velikost jako samotný blob. Méně = menší ghosts, více = větší. Tvar ghosts odpovídá vybranému tvaru vrstvy. Rychlost blednutí celé stopy se nastavuje globálně níže v "Efekty pozadí".':'100% makes trail ghosts the same size as the blob. Lower values make them smaller; higher values make them larger. Trail fade speed is configured globally under Background effects.',
    'Tečky této vrstvy náhodně vyzařují drobné třpytivé jiskřičky, které odletí kousek stranou a zhasnou. Hustotu, velikost a délku života třpytek nastavíš globálně níže v "Efekty pozadí" (globální hlavní vypínač musí být taky zapnutý).':'Dots in this layer emit small random sparkles that drift aside and fade. Configure sparkle density, size, and lifetime globally under Background effects; the global master switch must also be enabled.',
    'Tečky této vrstvy krátce ztmavnou v rytmu beatu — ale jen když hlasitost zůstane delší dobu skoro na 100 % (typicky "zeď zvuku" na dropu/vrcholu). Jednorázový hlasitý úder to nespustí, potřeba je souvislé držení hlasitosti nahoře. Každá vrstva má vlastní nezávislé nastavení níže.':'Dots in this layer briefly darken on the beat, but only while loudness stays near maximum long enough. A single loud hit does not trigger it. Each layer has independent settings below.',
    'Hlasitost musí být na/nad touto hodnotou, aby se počítala jako "skoro na maximu".':'Loudness must reach this value to count as near maximum.',
    'Jak dlouho musí hlasitost nepřetržitě zůstat nad prahem, než střihy vůbec začnou. Krátký pokles pod práh počítadlo vynuluje.':'How long loudness must remain continuously above the threshold before cuts begin. A brief drop below it resets the timer.',
    'Jak moc tato vrstva ztmavne v nejtmavším bodě jednoho střihu. 100 % = úplně neviditelná, méně = jen ztlumená.':'How dark this layer becomes at the darkest point of a cut. 100% is fully hidden; lower values only dim it.',
    'Jak dlouho trvá jeden střih od začátku ztmavení až po návrat zpátky do normálu.':'Duration of one cut from the start of darkening until the layer returns to normal.',
    'Pod touto jistotou detekce tempa se střihy nesynchronizují přesně na beat — místo toho poběží na pevný interval níže.':'Below this tempo-detection confidence, cuts use the fixed fallback interval instead of exact beat synchronization.',
    'Necháno vypnuté = tato vrstva používá sdílené mapování z kategorie Reakce na hudbu. Zapni override pro konkrétní cíl a nastav mu vlastní zdroj, citlivost i křivku, nezávisle na ostatních vrstvách.':'When left off, this layer uses the shared mapping above. Enable an override to give a target its own source, sensitivity, and curve.',
    '0 % = tempo neovlivňuje rychlost (násobitel 1×). 100 % = plný efekt mapování BPM → násobitel níže.':'0% means tempo does not affect speed. 100% applies the full BPM-to-multiplier mapping below.',
    '0 % = tempo neovlivňuje rychlost změny barvy (násobitel 1×). 100 % = plný efekt mapování BPM → násobitel níže.':'0% means tempo does not affect color-change speed. 100% applies the full BPM-to-multiplier mapping below.',
    'Pomalá písnička (BPM blíže min) násobí rychlost hodnotou „při min BPM" (např. 0 nebo 0,1). Rychlá (BPM blíže max) násobí „při max BPM" (typicky 1 = beze změny). Mezi tím plynule interpoluje.':'A slow track near the minimum BPM multiplies speed by the minimum-BPM value; a fast track near the maximum uses the maximum-BPM value. Values in between are interpolated smoothly.',
    'Pomalá písnička (BPM blíže min) násobí rychlost změny barvy hodnotou „při min BPM" (např. 0 nebo 0,1). Rychlá (BPM blíže max) násobí „při max BPM" (typicky 1 = beze změny). Mezi tím plynule interpoluje.':'A slow track near the minimum BPM multiplies color-change speed by the minimum-BPM value; a fast track uses the maximum-BPM value. Values in between are interpolated smoothly.',
    'Dodatečné časové vyhlazení výsledné hodnoty tohoto mapování — aplikuje se úplně naposled, po křivce odezvy i po Ultra boostu, takže vyhlazuje celý výsledek dohromady. 0 % (výchozí) = beze změny, vyšší = pomalejší/plynulejší reakce na náhlé skoky.':'Additional temporal smoothing applied last, after the response curve and Ultra boost. 0% leaves the result unchanged; higher values react more slowly and smoothly to sudden jumps.',
    'Nad prahem hodnota plynule (s vyhlazením) naroste až o zadané % navíc — zdroj na 100 % pak efektivně "vybouchne" nad rámec normálu.':'Above the threshold, the smoothed value grows by up to the configured extra percentage, allowing a 100% source to burst beyond the normal range.',
    'Jak rychle flash najede na plný jas, když namapovaná hodnota vzroste.':'How quickly a flash reaches full brightness when the mapped value rises.',
    'Jak dlouho flash doznívá, když hodnota zase klesne.':'How long a flash fades after the mapped value drops.'
  };
  EN["Hlasitost"]="Volume";
  EN["Zobrazuje Bass, Mid, High a Loudness vedle ovládací lišty. V užším okně se hodnoty přesunou do kompaktního řádku uvnitř panelu. Tempo a Beat zůstávají pouze zde."]="Shows Bass, Mid, High and Loudness beside the control bar. In narrower windows, the values move into a compact row inside the panel. Tempo and Beat remain here only.";
  Object.assign(EN, {"Barvy pozadí": "Background colors", "Základní pohyb": "Base motion", "Vývojářské / jemné doladění": "Developer / fine tuning", "Kartička skladby — nahoře (na obrazovce)": "Track card — top (on screen)", "Kartička skladby — dole (ovládací lišta)": "Track card — bottom (control bar)", "Časová osa (timeline)": "Timeline", "Tvar a rozměry": "Shape and dimensions", "Křivka hlasitosti nad ní": "Loudness waveform above the timeline", "Živé hodnoty MusicSense": "Live MusicSense values", "Aktuální hlasitost, pásma a tempo, jak je aplikace právě měří.": "Current volume, frequency bands and tempo as measured by the app.", "Zobrazit i přímo na obrazovce": "Also show on screen", "Přidá dvě malé kartičky vedle ovládací lišty, viditelné i se zavřeným nastavením. Zobrazují Bass, Mid, High a Loudness; Tempo a Beat zůstávají pouze zde.": "Adds two small cards beside the control bar, visible even with settings closed. They show Bass, Mid, High and Loudness; Tempo and Beat remain here only.", "Pokročilé: křivka odezvy": "Advanced: response curve", "Zobrazit horní kartičku": "Show the top card", "Kategorie nastavení": "Settings categories", "Vyber zdroj MusicSense a citlivost pro každou vlastnost pozadí. Živá hodnota je vidět u mapování. V křivce odezvy dole u každého mapování lze přidat až 3 body a upravit průběh reakce. Vodorovná osa je vstup, svislá výsledná odezva; rohy (0, 0) a (1, 1) jsou pevné.": "Choose a MusicSense source and sensitivity for each background property. Its live value appears beside the mapping. Use the response curve at the bottom of each mapping to add up to 3 points and shape the response. The horizontal axis is the input and the vertical axis is the output; the corners (0, 0) and (1, 1) are fixed.", "Přehrávání": "Playback", "Import hudby, názvy skladeb a vyrovnaná hlasitost.": "Music imports, track titles and consistent volume.", "Vzhled": "Appearance", "Písma, barvy, průhlednost a vrstvy pozadí.": "Fonts, colors, opacity and background layers.", "Reakce na hudbu": "Music reactivity", "Citlivost, mapování MusicSense a jemné doladění pohybu.": "Sensitivity, MusicSense mappings and fine control of motion.", "Kartičky a časová osa": "Cards & timeline", "Kartičky skladby nahoře i dole a společná nastavení časové osy.": "Top and bottom track cards and all timeline settings together.", "Živý zvuk": "Live audio", "Aktuální hodnoty MusicSense a zobrazení zvukového spektra.": "Current MusicSense readings and the audio spectrum.", "Knihovna a data": "Library & data", "Profily skladeb, zálohy a přenos nastavení.": "Track profiles, backups and settings transfer.", "Spustit hudbu po importu": "Play music after import", "Začít náhodnou skladbou": "Start with a random track", "Zpřehlednit názvy skladeb": "Clean up track titles", "Srdíčko a obrys reagují na hudbu": "Let the favorite outline follow the music", "Zobrazit křivku hlasitosti": "Show the loudness waveform", "Křivka zůstává viditelná": "Keep the waveform visible", "Vyrovnat hlasitost skladeb": "Match the volume of each track", "Cílová hlasitost (LUFS)": "Target volume (LUFS)", "Citlivost efektů na hudbu": "Music sensitivity", "Animované pozadí": "Animated background", "Viditelnost pozadí": "Background opacity", "Jemnější záblesky": "Gentler flashes", "Klidnější změny barev": "Gentler color changes", "Zobrazit hudební spektrum": "Show the music spectrum", "Spektrum uvnitř ovládacího panelu": "Spectrum inside Controlpanel", "Viditelnost spektra": "Spectrum opacity", "Jak rychle waterfall ujíždí = kolik pixelů odpovídá jedné sekundě hudby. Vyšší = rychlejší posun a vidíš méně sekund najednou, ale detailněji.": "Waterfall scroll speed: pixels per second of music. Higher values scroll faster and show fewer seconds at once, with more detail.", "Pomalá písnička (BPM blíže min) násobí rychlost hodnotou „při min BPM\" (např. 0 nebo 0,1). Rychlá (BPM blíže max) násobí „při max BPM\" (typicky 1 = beze změny). Mezi tím plynule interpoluje.": "A slow track near minimum BPM multiplies movement speed by the minimum-BPM value (for example 0 or 0.1). A fast track near maximum BPM uses the maximum-BPM value (typically 1 = unchanged). Values in between are interpolated smoothly.", "Pomalá písnička (BPM blíže min) násobí rychlost změny barvy hodnotou „při min BPM\" (např. 0 nebo 0,1). Rychlá (BPM blíže max) násobí „při max BPM\" (typicky 1 = beze změny). Mezi tím plynule interpoluje.": "A slow track near minimum BPM multiplies color-change speed by the minimum-BPM value (for example 0 or 0.1). A fast track near maximum BPM uses the maximum-BPM value (typically 1 = unchanged). Values in between are interpolated smoothly."});
  Object.assign(EN,{"Jemné doladění": "Fine tuning", "Klidnější efekty": "Gentler effects", "Pohyb a reakce": "Motion & response", "Profily skladeb": "Track profiles", "Záloha nastavení": "Settings backup", "Přehrávání": "Playback", "Hlasitost": "Volume", "Názvy skladeb": "Track names", "Vzhled": "Appearance", "Pozadí": "Background", "Barvy": "Colors", "Rozhraní": "Interface", "Efekty": "Effects", "Reakce": "Reactivity", "Citlivost": "Sensitivity", "Analýza": "Analysis", "Ovládání": "Controls", "Kartičky": "Track cards", "Časová osa": "Timeline", "Ovládací lišta": "Control bar", "Živý zvuk": "Live audio", "Živé hodnoty": "Live values", "Spektrogram": "Spectrogram", "Data": "Data"});
  Object.assign(EN, {"Vzhled playlistu": "Playlist appearance", "Neprůhlednost pozadí": "Background opacity", "Rozmazání pozadí": "Background blur", "\"Barva přehrávače\" = tato vrstva vždy odpovídá barvě přehrávače nastavené v kategorii Vzhled (statická, nebo živě synchronizovaná, podle \"Synchronizovat s Rychlost změny spektra\" tam). \"Vlastní barva\" = pevná barva zvolená níže. Obojí ignoruje rotaci odstínu a vše pod tímto výběrem.": "\"Player color\" follows the player color configured in Appearance, either static or synchronized with Spectrum change speed. \"Custom color\" uses the fixed color selected below. Both ignore hue rotation and the controls below this selector."});
  Object.assign(EN, {"Jistota tempa (%)": "Tempo confidence (%)", "Vlevo od timeline": "Left of timeline", "Vpravo od timeline": "Right of timeline", "Vpravo (okraj obrazovky/panelu)": "Right (edge of screen/panel)"});
  Object.assign(EN, {"Hover efekty": "Hover effects", "Záře poblíž kurzoru": "Glow near the pointer", "Intenzita záře": "Glow intensity", "Vzdálenost zvýraznění": "Highlight distance", "Při najetí skrýt pozadí prvků panelu": "Clear control backgrounds on hover", "Vzhled nastavení": "Settings appearance", "Sklo ve stylu Control Island": "Control Island glass style", "Neprůhlednost pozadí": "Background opacity", "Rozmazání pozadí": "Background blur", "Zaoblení rohů": "Corner radius", "Neprůhlednost obrysu": "Outline opacity", "Tloušťka obrysu": "Outline width", "Zobrazení hodnot na obrazovce": "On-screen values visibility", "Vždy": "Always", "Poblíž ovládacího panelu": "Near Control Island", "Při pohybu myši": "On mouse movement", "Skrýt po nečinnosti": "Hide after inactivity", "Řadit podle": "Sort by", "Pořadí importu": "Import order", "Název skladby": "Track title", "Interpret": "Artist", "Délka skladby": "Track duration", "Oblíbené nejdříve": "Favorites first", "Směr řazení": "Sort direction", "Normálně": "Normal", "Obráceně": "Reverse", "Animace nastavení": "Interface animations"});
  Object.assign(EN, {
  "Barva alba/tečky skladby, timeline a ikony ozubeného kolečka. Pevné barvy nebo globální synchronizace s hudbou.": "Colors for track artwork, the timeline and settings icon. Use a fixed palette or global music synchronization.",
  "Zapnuto = barvy přehrávače řídí globální Rychlost změny spektra níže, i při vypnutém pozadí. Vypnuto = pevné barvy níže.": "On uses the global Spectrum color speed below, even with the background off. Off uses the fixed colors below.",
  "Zapnuté prvky používají synchronizované barvy. Vypnuté používají pevné barvy:": "Enabled elements follow synchronized colors. Disabled elements use the fixed palette:",
  "Globální změny barev": "Global color animation",
  "Sdílená rychlost barev přehrávače a pozadí. Funguje i při vypnutém pozadí; vlastní mapování vrstev má přednost.": "Shared color speed for the player and background. Works with the background off; individual layer mappings take priority.",
  "Animace jednotlivých částí": "Individual animations",
  "Dosah a zvýraznění": "Reach & highlighting",
  "Nastavení efektu": "Effect settings",
  "Synchronizované prvky": "Synchronized elements",
  "Zesílení a omezení": "Boost & limits",
  "Synchronizace s tempem": "Tempo synchronization",
  "Citlivost tempa": "Tempo sensitivity",
  "Zdroj": "Source",
  "Výška": "Height",
  "Šířka": "Width",
  "Exportuje/importuje úplně všechno: vrstvy pozadí, tvary, MusicSense mapování, křivky, citlivosti, barvy — celý stav aplikace v jednom JSON souboru. Profily hlasitosti (LUFS) se exportují zvlášť v sekci Uložené profily.": "Export or import the complete app state in one JSON file: background layers, shapes, MusicSense mappings, curves, sensitivity and colors. Export loudness profiles separately under Saved profiles."
});
  Object.assign(EN,{"Vyhlazení a analýza":"Smoothing & analysis","Oblast a geometrie":"Area & geometry","Vykreslování":"Rendering","Styl panelu":"Panel style","Časová osa a spektrum":"Timeline & spectrum"});
  EN["Jistota"]="Confidence";
  EN["EBU R128 normalizace"]="EBU R128 normalization";
  EN["Pozadí a efekty scény jsou na mobilu automaticky vypnuté."]="Background and scene effects are automatically disabled on mobile.";
  Object.assign(EN,{
  "Podrobnosti": "Details",
  "Obecné": "General",
  "Základní": "Basics",
  "Ovládání": "Controls",
  "Okno nastavení": "Settings window",
  "Efekty scény": "Scene effects",
  "Reakce efektů": "Effect response",
  "Křivka hlasitosti": "Loudness waveform",
  "Ovládání a vzhled": "Controls & layout",
  "MusicSense · živé hodnoty na obrazovce": "MusicSense · on screen live values",
  "Živé hodnoty basů, středů, výšek a hlasitosti nad ovládacím panelem. Ovlivňuje pouze jejich zobrazení; analýza hudby pro vizuální efekty pokračuje.": "Live bass, mid, high and loudness values above the control bar. This only controls their display; music analysis for visual effects continues.",
  "Pokročilé: zapnuto": "Advanced: on",
  "Pokročilé: vypnuto": "Advanced: off",
  "Pokročilé nastavení": "Advanced settings",
  "Zobrazit jemné ladění. Skrytí nemění uložené hodnoty.": "Show fine controls. Hiding them keeps your saved values.",
  "Jazyk, přehrávání, rozhraní a výkon.": "Language, playback, interface and performance.",
  "Barvy, ovládací panel, kartičky a playlist.": "Colors, controls, track cards and playlist.",
  "Hlasitost skladeb a zvukové vstupy vizuálních efektů.": "Track volume and audio input for visual effects.",
  "Typ vizualizace, její vzhled a efekty celé scény.": "Visualization, its appearance and scene-wide effects.",
  "Vrstvy a barvy pozadí, jejich pohyb a reakce na hudbu.": "Background layers, colors, motion and music response.",
  "Časová osa, křivka hlasitosti a spektrogram.": "Timeline, loudness waveform and spectrogram.",
  "Záloha nastavení a uložené profily skladeb.": "Settings backups and saved track profiles.",
  "Vypnuto = společné mapování z Pozadí → Reakce na hudbu. Vlastní mapování nahradí zdroj a citlivost pouze pro tuto vrstvu.": "Off uses the shared mappings in Background → Music response. A custom mapping replaces the source and sensitivity only for this layer.",
  "Rozsah Loudness %": "Loudness range",
  "Redukce bolesti hlavy": "Gentler effects"
});
  Object.assign(EN, {"\"Barva přehrávače\" = tato vrstva vždy odpovídá barvě přehrávače nastavené v Přehrávač → Barvy (pevné nebo synchronizované). \"Vlastní barva\" = pevná barva zvolená níže. Obojí ignoruje rotaci odstínu a vše pod tímto výběrem.": "\"Player color\" follows the fixed or synchronized color in Player → Colors. \"Custom color\" uses the fixed color selected below. Both ignore hue rotation and the controls below this selector."});
  const CS = Object.fromEntries(Object.entries(EN).map(([cs,en])=>[en,cs]));
  function sourceText(value){const t=value.trim();return CS[t]?value.replace(t,CS[t]):value;}
  const renderedText = new WeakMap();
  const renderedAttrs = new WeakMap();
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let language='en';
  try{if(localStorage.getItem(LANGUAGE_KEY)==='cs')language='cs';}catch{}
  let applying = false;
  function translateValue(value){
    const trimmed = value.trim();
    if(EN[trimmed]) return value.replace(trimmed, EN[trimmed]);
    let match = trimmed.match(/^(\d+) skladeb$/);
    if(match) return value.replace(trimmed, `${match[1]} tracks`);
    match = trimmed.match(/^Vrstva (\d+) — (.+)$/);
    if(match) return value.replace(trimmed, `Layer ${match[1]} — ${EN[match[2]] || match[2]}`);
    match = trimmed.match(/^(\d+)× tečka, velikost ([\d.]+)×(?: · (.+))?$/);
    if(match){
      const motion = match[3] ? ` · ${EN[match[3]] || match[3]}` : '';
      return value.replace(trimmed, `${match[1]}× dot, size ${match[2]}×${motion}`);
    }
    match = trimmed.match(/^Přidat vrstvu \((\d+) volných z (\d+)\)$/);
    if(match) return value.replace(trimmed, `Add layer (${match[1]} available of ${match[2]})`);
    match = trimmed.match(/^Importováno (\d+) profilů$/);
    if(match) return value.replace(trimmed, `Imported ${match[1]} profiles`);
    match = trimmed.match(/^Hotovo — (\d+) skladeb přeparsováno\.$/);
    if(match) return value.replace(trimmed, `Done — re-detected ${match[1]} tracks.`);
    if(trimmed.startsWith('Dnes ')) return value.replace(trimmed, 'Today ' + trimmed.slice(5));
    if(trimmed.startsWith('Včera ')) return value.replace(trimmed, 'Yesterday ' + trimmed.slice(6));
    if(trimmed.startsWith('Bulk analýza selhala pro ')) return value.replace(trimmed, 'Bulk analysis failed for ' + trimmed.slice(25));
    return value;
  }
  function isUserMetadata(node){
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if(parent?.closest('[data-ui-placeholder]')) return false;
    return !!(parent && parent.closest('[data-user-metadata], #trackList .track-info, #metaTitle, #metaArtist, #barTitle, #barArtist, #tipTitle, #tipArtist, #stageTipTitle, #stageTipArtist'));
  }
  function translateTree(root){
    if(!root || isUserMetadata(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    if(root.nodeType === Node.TEXT_NODE) nodes.unshift(root);
    nodes.forEach(node=>{
      if(isUserMetadata(node)) return;
      if(!originalText.has(node) || (renderedText.has(node) && node.nodeValue !== renderedText.get(node))) originalText.set(node, sourceText(node.nodeValue));
      const original = originalText.get(node);
      const value = language === 'en' ? translateValue(original) : original;
      renderedText.set(node,value);
      if(node.nodeValue !== value) node.nodeValue = value;
    });
    const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll('*')] : [];
    elements.forEach(element=>{
      if(isUserMetadata(element)) return;
      if(!originalAttrs.has(element)) originalAttrs.set(element, {});
      const saved = originalAttrs.get(element);
      if(!renderedAttrs.has(element))renderedAttrs.set(element,{});
      const last=renderedAttrs.get(element);
      ['title','placeholder','aria-label'].forEach(attr=>{
        if(!element.hasAttribute(attr)){delete saved[attr];delete last[attr];return;}
        if(element.hasAttribute(attr) && (saved[attr] === undefined || (last[attr] !== undefined && element.getAttribute(attr) !== last[attr]))) saved[attr] = sourceText(element.getAttribute(attr));
        if(saved[attr] !== undefined){ const value=language === 'en' ? translateValue(saved[attr]) : saved[attr]; last[attr]=value;if(element.getAttribute(attr)!==value) element.setAttribute(attr,value); }
      });
    });
  }
  function applyLanguage(){
    window.Aurora.SettingsHelp?.hide();
    applying = true;
    document.documentElement.lang = language;
    translateTree(document.body);
    const select = document.getElementById('auroraLanguage');
    if(select) select.value = language;
    applying = false;
  }
  const nativeAlert = window.alert.bind(window);
  window.alert = message=>nativeAlert(language === 'en' ? translateValue(String(message)) : message);
  function installSelector(){
    if(document.getElementById('auroraLanguage')) return;
    const fontControl = document.getElementById('ctl-fontBody');
    const block = fontControl && fontControl.closest('.setting-block');
    if(!block) return;
    const row = document.createElement('div');
    row.className = 'range-row';
    row.innerHTML = '<div class="range-label-row"><span>Jazyk</span></div><select class="map-select" id="auroraLanguage"><option value="cs">Čeština</option><option value="en">English</option></select>';
    block.insertBefore(row, block.querySelector('.range-row'));
    row.querySelector('select').addEventListener('change', event=>{
      language = event.target.value;
      try{localStorage.setItem(LANGUAGE_KEY,language);}catch{window.Aurora.notify?.('Jazyk se nepodařilo uložit.',{error:true});}
      applyLanguage();
    });
  }
  installSelector();
  applyLanguage();
  document.dispatchEvent(new Event('aurora-language-ready'));
  new MutationObserver(records=>{
    if(applying) return;
    applying = true;
    records.forEach(record=>{
      if(record.type === 'childList') record.addedNodes.forEach(node=>translateTree(node));
      if(record.type === 'characterData') translateTree(record.target);
      if(record.type === 'attributes') translateTree(record.target);
    });
    applying = false;
  }).observe(document.body, {
    childList:true,
    subtree:true,
    characterData:true,
    attributes:true,
    attributeFilter:['title','placeholder','aria-label']
  });
})();
});
