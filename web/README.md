# Vitruvius & Partners — sito di gruppo

Next.js 16 (App Router) · TypeScript · GSAP + ScrollTrigger · Lenis · Tailwind CSS 4. Nessuna scena 3D: il sito non dipende da WebGL.

## Avvio

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

Node 20.9 o successivo.

## Variabili d'ambiente

Copia `.env.example` in `.env.local` (in locale) o impostale su Vercel.

| Variabile | Uso |
| --- | --- |
| `RESEND_API_KEY` | Invio email dei moduli Contatti e Candidatura (Resend). In sviluppo, senza chiave, i messaggi vengono solo scritti nel log; in produzione il visitatore vede “Invio non riuscito” con l’indirizzo email, così nessun messaggio va perso in silenzio. |
| `MAIL_FROM` | Mittente, su un dominio verificato in Resend. Default: `Sito Vitruvius & Partners <noreply@vitruviusandpartners.com>` |
| `MAIL_TO` | Destinatario. Default: `info@vitruviusandpartners.com` |

Il CV allegato è limitato a 5 MB (PDF, DOC, DOCX); il limite del corpo delle Server Action è 6 MB (`next.config.ts`).

## Font

Aktiv Grotesk arriva dal web kit Adobe Fonts **`zgd5zbh`** (Light 300, Regular 400, Bold 700), caricato in `app/[lang]/layout.tsx`.

- Il kit è abilitato per `localhost`, `127.0.0.1`, `vitruviusandpartners.com`, `www.vitruviusandpartners.com`, `*.vercel.app`. Se il sito va su un altro dominio (staging), va aggiunto nelle impostazioni del kit su fonts.adobe.com.
- **Non** impostare `font-display: swap` nel kit: i titoli animati si dividono in righe quando entrano in scena, e con swap la divisione avverrebbe con il font di riserva, tagliando le righe dopo il cambio.
- Il kit importa un foglio di conteggio di Adobe (`p.typekit.net/p.css…`): `components/layout/PreloadFonts.tsx` lo precarica, così i due file partono insieme invece che uno dopo l'altro. Se il kit cambia, aggiorna l'indirizzo (è l'`@import` in testa al CSS del kit).
- Nessun font di sistema è previsto nel design: i fallback nello stack CSS servono solo durante il caricamento.

## Lingue e URL

- Italiano alla radice (`/chi-siamo`, `/progetti`, `/news`, `/lavora-con-noi`, `/contatti`).
- Inglese sotto `/en` con slug inglesi (`/en/about-us`, `/en/projects`, `/en/news`, `/en/careers`, `/en/contact`).
- La mappa degli slug è in `lib/i18n.ts`; la riscrittura degli URL è in `proxy.ts`.
- Gli URL del vecchio WordPress (news alla radice, `/jobs/…`, `/current-jobs`, `/category/news`, `/pablot`) hanno redirect permanenti in `next.config.ts`.
- `sitemap.xml` (con hreflang) e `robots.txt` sono generati da `app/sitemap.ts` e `app/robots.ts`.
- **Indirizzo del sito** (`lib/site.ts`): link canonici, sitemap, dati strutturati e immagini di condivisione usano il dominio di produzione del progetto su Vercel (`VERCEL_PROJECT_PRODUCTION_URL`): oggi l'indirizzo vercel.app, il dominio del gruppo appena viene collegato, senza toccare il codice. Fuori da Vercel vale `company.url`.
- **Indicizzazione**: le pagine servite da un host diverso dal dominio del gruppo (vercel.app, anteprime dei rami) rispondono con `X-Robots-Tag: noindex` (`proxy.ts`), così la copia di prova non compete con il sito vero. Collegato il dominio, il sito diventa indicizzabile da solo.
- **Titoli e descrizioni** (`lib/seo.ts`): `metaText` pulisce le descrizioni (tag, entità, anche doppie) e le taglia a fine parola entro 155 caratteri; `metaTitle` toglie “— Vitruvius & Partners” dai titoli lunghi, così un risultato di ricerca mostra le parole che contano.
- **Immagini di condivisione** (`lib/og.tsx`, `app/og/`): ogni pagina principale, operazione e posizione aperta ha la sua immagine 1200 × 630 (logo, sezione, titolo, piano inclinato del simbolo), generata alla build; gli articoli usano la loro foto. Il carattere è Inter (licenza OFL, `assets/fonts/`): la licenza Adobe di Aktiv Grotesk non copre l'uso nelle immagini.
- **Fonti sparite** (`content/deadLinks.ts`): i link a fonti non più online puntano alla loro copia su archive.org; dove non c'è copia resta il nome della fonte, con “non più online”. Il controllo dei link va ripetuto ogni tanto.

## Dove si modificano i contenuti

| Cosa | File |
| --- | --- |
| Testi di interfaccia e pagine (IT / EN) | `content/dictionaries/it.ts`, `content/dictionaries/en.ts` |
| Dati societari, sedi, social, certificazioni | `content/site.ts` |
| Operazioni (home, indice e pagine progetto) | `content/projects.ts` |
| Evidenze: valore della produzione, classifiche, attività, qualifiche | `content/evidence.ts` |
| News, posizioni aperte, team | generati da `scripts/build-content.mjs` in `content/generated/*.json` |

News, offerte di lavoro e team sono stati estratti dal sito attuale (`../content-raw/`, un file markdown per pagina). Per rigenerarli:

```bash
node scripts/build-content.mjs            # legge ../content-raw
CONTENT_RAW=/percorso/altro node scripts/build-content.mjs
```

Per aggiungere una news senza passare dallo script, aggiungi un oggetto in `content/generated/news-it.json` (e l'eventuale traduzione in `news-en.json`, collegata dal campo `translation`).

## Brand

- Logo e simbolo: `public/brand/` e `components/brand/logo-paths.ts`. Sono i vettori esatti della **tavola 2** di `Proposte_rebranding_VP.ai`, esportati senza ridisegno; la “&” viene dalla versione rivista del logo orizzontale (`VP_lockup_orizzontale_rev.svg`, ottobre 2026), uguale in tutto il resto. È sostituita nel componente `Logo`, nei file del logo orizzontale (colori, navy, bianco, da cui escono anche le immagini di condivisione), nella scritta da sola e nella “&” da sola.
- Il segno-unità del sito (`components/marks/Mark.tsx`) è il tratto principale dello stesso simbolo, non ridisegnato. Il simbolo non viene ingrandito da solo come elemento decorativo.
- Palette (`app/globals.css`, `@theme`): navy `#0A2342`, slate `#6B7280`, paper `#FAFAF9`, bianco, ink `#0F172A`, hairline `#DCE1E6`. Nessun altro colore: i toni secondari sono opacità della palette.
- Favicon e apple-icon (`app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`) usano la versione negativa su navy, come le immagini di condivisione (`lib/og.tsx`, vedi «Lingue e URL»).

## Contenuti: regola di verifica

Ogni affermazione del sito viene da una fonte pubblicata dal gruppo (News & Press, sito attuale, PDF delle certificazioni) o dagli articoli di stampa che il gruppo stesso cita. Niente è dedotto o arrotondato.

- **Operazioni** (`content/projects.ts`): contesto, intervento, cifre, stato e fonti. Le cifre dichiarano la loro natura: *dato documentato* oppure *obiettivo dichiarato* (es. il −50% di Civitas 5, non ancora misurato). Dove un risultato non è pubblicato, il caso lo dice.
- **Evidenze** (`content/evidence.ts`): valore della produzione, classifiche, qualifiche, ognuna con la sua fonte (pagina Chi siamo, “Le verifiche esterne”).

## Immagini

- **Foto indicative** in `public/images/placeholder/` (licenze e provenienza in `CREDITS.md`): hero, le tre fasi del gruppo, Chi siamo, banda Contatti, Lavora con noi, foto sotto le operazioni. Vanno sostituite con le foto del gruppo (vedi **Scatti da fare o da chiedere**).
- **Un solo trattamento** per tutte: `tools/grade.py` le desatura e porta le ombre verso il navy del marchio e le luci verso il bianco carta, così si leggono come una famiglia e non competono con le immagini vere. Originali non trattati in `assets/stock/web-src/`; per rigenerare: `python3 -I tools/grade.py assets/stock/web-src web/public/images/placeholder`.
- **La home è a colori**: le sue cinque foto (apertura, Sviluppare, Costruire, Valorizzare, «Proponi un immobile») sono una serie a sé in `public/images/home/`, scelta su un filo comune (sole caldo, intonaci ocra e terracotta, un tocco di azzurro) e trattata con `tools/grade_colour.py` («luce naturale»: bianco e esposizione uniformati, saturazione appena contenuta, ombre verso il navy, luci verso un bianco caldo). Originali in `assets/stock/colour-src/`; crediti e licenze in `public/images/home/CREDITS.md`. Nella home la banda finale mostra la foto a colori sotto un velo navy che si infittisce verso il testo (`ContactBand` con `vivid`).
- **Niente edifici riconoscibili** (Getty Center, Kiasma, Porta Nuova e simili): farebbero pensare a opere del gruppo. Sono stati tolti.
- **Progetti**: ogni operazione ha `image` (l'immagine pubblicata dal gruppo nella news del caso) sopra `placeholder` (una foto indicativa). La foto indicativa porta sempre l'etichetta “Immagine indicativa” e resta visibile solo dove l'immagine del gruppo non si carica (per esempio nell'anteprima, che non raggiunge il server WordPress). Nessuna foto stock viene presentata come il progetto.

### Scatti da fare o da chiedere

Formato per tutti: originali JPEG o TIFF, almeno 2800 px sul lato lungo, senza filtri (il trattamento si applica dopo, uguale per tutti), liberatorie per le persone riconoscibili, diritti d'uso web senza scadenza, nome del fotografo per i crediti.

| Priorità | Dove | Soggetto | Formato |
|---|---|---|---|
| 1 | Home, apertura | Un edificio o un cantiere del gruppo in luce radente. Su desktop la massa navy copre il terzo sinistro: il soggetto va a destra. | Orizzontale 3:2 + verticale 4:5 |
| 1 | Home, «Sviluppare» | Il lavoro di progetto vero: tavole, sopralluogo, ufficio tecnico al lavoro. | Verticale 4:5 |
| 1 | Home, «Costruire» | Un cantiere di Vitruvius Construction: gru, ponteggi, squadre con i DPI del gruppo. | Verticale 4:5 |
| 1 | Home, «Valorizzare» | Un interno finito di un immobile di Vitruvius Living, luce naturale. | Verticale 4:5 |
| 1 | Palazzo ex INPS | La facciata su Corso Italia 30, oggi. | 16:9 + 4:5 |
| 1 | Via Asinari | Il complesso di Asti, stato attuale. | 16:9 + 4:5 |
| 1 | Civitas 5 | Cantiere o render ufficiali (con il permesso d'uso dello studio Panzeri). | 16:9 + 4:5 |
| 2 | Chi siamo | Immagine larga: la sede di Milano, il team, un dettaglio di cantiere del gruppo. | 21:9 (e 4:5 per il telefono) |
| 2 | Contatti | Facciata o ingresso delle sedi di Milano (via Stresa 6) e Asti (corso Torino 285). | Orizzontale 3:2 |
| 2 | Lavora con noi | Persone del team in ufficio; una squadra in cantiere. | 4:5 + orizzontale a tutta pagina |
| 2 | Team | Ritratti con stesso fondo e stessa luce (oggi mancano per alcune persone: si vedono le iniziali). | 4:5, 1600 px |

Per sostituire una foto: stesso nome file in `public/images/placeholder/` (oppure un nuovo percorso nel componente), e per i progetti il campo `image` in `content/projects.ts`; l'etichetta “Immagine indicativa” sparisce da sola quando l'immagine del gruppo si carica.

## Aggiungere un'operazione

Le operazioni sono in `content/projects.ts`. Ne servono almeno cinque perché la fila della home diventi “fissa” e scorrevole di lato su desktop (`components/home/ProjectRail.tsx`, costante `PIN_FROM`); sotto le cinque è una griglia. Ogni nuova operazione richiede, da fonti pubblicate dal gruppo o da articoli che il gruppo cita: nome, luogo, anno, stato, una frase di sintesi, contesto, intervento, competenze, esito (documentato, obiettivo o stato), cifre con la loro natura (`documented` / `target`), fasi con data, fonti con link. Nessun campo si riempie per deduzione: se un dato non è pubblicato, il caso dice a che punto è.

## Home

Una cosa per schermata, niente nascosto dietro un passaggio del mouse:

1. **Apertura** — “Governare la complessità.” Su desktop una massa navy tagliata con l'inclinazione del simbolo copre la foto e si ritira lungo la stessa inclinazione scorrendo. Su telefono e tablet la foto sta sopra e la massa sotto, con un gradino tagliato sull'inclinazione che entra nella foto.
2. **Il gruppo: come lavora** — Sviluppare → Costruire → Valorizzare, ognuna con chi la fa, una frase e **una prova pubblicata**: 15,87 M€ del Palazzo ex INPS (con link al caso), l'attestazione SOA OG1 classe III (con link alle qualifiche), 200+ immobili l'anno dichiarati da Vitruvius Living. La filiera (`components/home/Filiera.tsx`): sotto il titolo di sezione (uguale a tutte le pagine) la catena resta ferma mentre la pagina scorre e lo scorrimento la fa avanzare. A sinistra i tre verbi, grandi, in contorno: si riempiono di navy uno dopo l'altro con il bordo sulla pendenza del simbolo e restano pieni (il presente navy pieno, i passati navy chiaro); sotto, chi lo fa, la frase, il dato pubblicato e il link. A destra, lasciata una colonna libera, la foto in un rettangolo pulito: quella di ogni passaggio entra sopra la precedente lungo la stessa pendenza. I verbi portano a ciascun passaggio, anche da tastiera. Lo scorrimento come tempo è `lib/useScrollTime.ts`, lo stesso di «Sei anni, in cifre».
3. **In numeri e in stampa** — 300+ cantieri, 30+ città, 73,8 M€ (2023), 83° nella Top 200; sotto, le testate che hanno scritto delle operazioni (Il Secolo XIX, La Stampa, Agi, Affaritaliani.it, Il Corriere Nazionale), solo come testo, ognuna col link all'articolo.
4. **Progetti** — griglia di tre su desktop, fila da sfogliare su telefono con indicatore «1 / 3».
5. **Contatti** — una frase, un bottone che apre il modulo con l'argomento «Proporre un immobile» già scelto (`?topic=property`), l'email. Le sedi sono nel footer, che è chiaro e compatto.

Su telefono la home è circa un quarto più corta della versione precedente, pur con due blocchi in più (le prove e la stampa).

## Lavora con noi

Titolo e foto in apertura con il bottone “Posizioni aperte”, il team in numeri su una foto di cantiere, le posizioni aperte (banda navy sull'inclinazione al passaggio del mouse), «Cosa offriamo», i tre passaggi per candidarsi, LinkedIn. Ogni posizione ha in apertura sede, contratto e data, poi il riquadro «In breve» (contratto, durata, orario, esperienza, cosa offre: sul telefono prima del testo, sul desktop a lato e sempre in vista), i passaggi accanto al modulo e in fondo le altre posizioni.

- **`content/jobFacts.ts`**: i dati «In breve» di ogni annuncio, ripresi dal suo testo e tradotti, per slug. Elenca solo condizioni concrete (benefit, retribuzione), non frasi come «contesto dinamico». La sezione «Cosa offriamo» li raccoglie da tutte le posizioni, con accanto quelle che li prevedono. Va aggiornato insieme a `content/generated/jobs.json`; un annuncio senza voce mostra le sue specifiche, senza la «Categoria offerta» interna.
- **Titoli con trattino**: `DashTitle` tiene unita la parola prima del trattino, così una riga non comincia mai con «–». La divisione in righe dei titoli (`RevealScope`) lascia intatti gli elementi `.vp-keep`.

## Chi siamo

- **Chi guida il gruppo** (`components/about/Leadership.tsx`): ogni dirigente è un tratto del simbolo. Su desktop cinque bande tagliate con l'inclinazione esatta del marchio (`--slope`), affiancate come i tratti del logo, i ritratti in bicromia navy; passando su una banda o su un nome della legenda sotto (o raggiungendolo da tastiera) la banda si allarga e la persona torna a colori con nome, ruolo e società. Lasciata in vista, la sezione scorre da sola una persona ogni 4,2 s finché il visitatore non la tocca (niente scorrimento con «riduci movimento»). La legenda è l'elenco leggibile e accessibile; le bande sono decorative (`aria-hidden`). Sul telefono i ritratti sono una fila da scorrere col dito. Persone e foto da `content/generated/team.json` (gruppo LEADERSHIP). Le bande ingrandiscono molto le foto: servono ritratti di almeno 1600 px di lato.
- **Sei anni, in cifre** (`components/about/Chronicle.tsx`): tappe e numeri in un'unica storia. La sezione resta ferma mentre la pagina scorre e lo scorrimento fa avanzare il tempo: l'anno rotola cifra per cifra, compaiono la tappa e i dati pubblicati di quell'anno, ciascuno con la sua fonte (da `content/evidence.ts`), e a destra un solo grafico si costruisce anno per anno: le barre della produzione si riempiono quando il tempo le raggiunge (da contorno a pieno, come vuole il marchio), la linea della Top 200 disegna la risalita. La fila degli anni sotto il grafico è l'asse del tempo e porta a qualunque anno (anche da tastiera). Per i lettori di schermo c'è l'elenco ordinato delle tappe con dati e fonti. Per il 2025 e il 2026 compare la foto del progetto, tagliata sulla pendenza del simbolo.
- **Le persone del gruppo** (`components/about/TeamWall.tsx`): solo chi lavora nei reparti (i soci sono già sopra). Su desktop ogni persona è un piccolo tratto del simbolo e i tratti, sfalsati riga per riga, formano un unico grande tratto: il gruppo è il marchio. Ritratti in bicromia navy; passando su un volto torna a colori e nome e ruolo compaiono nell'angolo libero in basso a sinistra; in alto a destra si sceglie una squadra, che si accende mentre le altre si spengono. I posti dopo l'ultima persona sono tratti in contorno, accanto al link alle posizioni aperte. Sotto, una riga per squadra con il numero di persone: aprendola (o scegliendo la squadra in alto) la squadra si accende nel muro e si aprono nomi e ruoli in quattro colonne; passare sopra la squadra in alto la mostra solo nel muro. Sul telefono ogni squadra è una fila di ritratti da scorrere.
- **Ritratti**: serviti dal sito stesso (`public/team/`), non dal vecchio sito. Dopo `build-content.mjs` si aggiornano con `NODE_USE_ENV_PROXY=1 node scripts/team-photos.mjs` (la variabile serve solo dietro un proxy), che scarica, converte in JPEG e scrive `content/generated/team-photos.json`. Le sagome segnaposto del vecchio sito sono escluse: chi non ha un ritratto mostra le iniziali.
- **Dati in apertura**: ogni voce occupa due righe di una griglia condivisa (`subgrid`), così le etichette restano allineate anche se un valore va a capo.

## Contatti e News

- **Contatti**: email e telefoni subito, poi le due sedi (con “Apri in Mappe”) accanto a un plastico inquadrato sul Nord-Ovest che, passando su un indirizzo, si avvicina alla sua città (`MapSlab` con `frame`, `zoomScale` e `[data-map-target]`), il modulo, i dati societari. Il modulo chiede prima l'argomento (immobile, investimento, fornitore, stampa, altro); per un immobile aggiunge città, tipologia, superficie, stato, telefono e fino a 5 foto (JPG, PNG, WEBP, 5 MB in tutto), e l'email arriva con oggetto «[Proposta immobile] dal sito — Città — Nome». Accanto, quattro dati di solidità già documentati in Chi siamo.
- **Moduli**: React 19 svuota un modulo dopo ogni invio, anche con errori. Contatti e Candidatura inviano con `useSubmitKeepingValues` (`components/forms/Fields.tsx`): i campi restano finché l'invio non riesce. L'attributo `action` resta, quindi i moduli funzionano anche prima dell'idratazione.
- **News** (`components/sections/NewsCabinet.tsx`): l'archivio come una cassettiera, un cassetto per anno, il più recente in alto. Ogni frontale ha l'anno in un portaetichette e il tratto del marchio come maniglia; sopra il frontale spuntano le linguette delle schede, una per articolo, che salgono quando si passa sul cassetto (si vede quanto è pieno). Aprendolo il frontale diventa navy e le schede salgono una dopo l'altra in una griglia a filetti navy (immagine, testata o «Dal gruppo», titolo, data); la prima scheda si allarga quanto serve perché le righe tornino piene. All'arrivo sono aperti i cassetti più recenti, fino a mostrare almeno tre articoli. Filtro (Tutte, Dal gruppo, Rassegna stampa) e ricerca su titolo e testata (senza distinzione di maiuscole e accenti) agiscono su tutti i cassetti: si aprono quelli con risultati, gli altri si spengono. «Pesca a caso» apre un cassetto e indica un articolo. Le voci di rassegna si riconoscono dalla testata a inizio titolo (`pressOutlet` in `lib/content.ts`), che il sito mostra a parte. Ogni articolo ha a lato data, sezione e, se c'è, il progetto di cui parla.

## Progetti: mappa e scheda

- **Mappa «Dove operiamo»** (`components/map/`): un plastico da studio di architettura. Tavola bianca con il reticolo ogni 2°, Paesi confinanti appena rialzati, l'Italia come blocco chiaro e, più in alto e in navy (in bianco sulle sezioni blu), le regioni delle sedi e delle operazioni. Ogni luogo è uno spillo da plastico: punto a terra con un anello che pulsa, asta, bandierina con il nome della città (segno pieno per le sedi, a contorno per le operazioni, come nell'elenco). Le aste hanno altezze diverse e le bandierine si aprono a est o a ovest per non sovrapporsi, con una disposizione a parte per i telefoni; sedi e operazioni nella stessa città condividono lo spillo. Lo scorrimento inclina il piano. Passando su una voce dell'elenco (desktop) la carta zooma sul luogo spostando il `viewBox` degli SVG, quindi resta nitida, e restano in piedi solo la sua bandierina e la sua asta; nelle pagine progetto l'inquadratura è calcolata sul server e si vede solo la bandierina dell'operazione. Nessun WebGL.
- **Cartografia**: Natural Earth 1:10m (dominio pubblico), proiettata e semplificata da `tools/build-map.mjs` in un unico file statico, `public/map/italia.svg` (≈22 KB compressi, in cache), che ogni strato richiama con `<use>`; `content/geo/map.json` contiene inquadratura, nomi delle regioni e città. Il file ha anche ogni regione come forma (`#r-lombardia`…) e i laghi divisi per regione (`#lakes-lombardia`…). Lo script descrive dati e dipendenze per rigenerarli.
- Coordinate e regione stanno in `coords` e `area` (sedi in `content/site.ts`, operazioni in `content/projects.ts`); `mapPins()` in `components/map/mapPlaces.tsx` li raccoglie per tutte le mappe. Un cantiere in una nuova regione la alza da solo: per l'archivio dei cantieri basta aggiungere luoghi lì.
- **Pagina progetto**: apertura a tutto schermo, frase e cifre, poi una sezione unica con la scheda che resta in vista (luogo, indirizzo, anno, stato, ruolo, mini mappa, «Apri in Mappe») e accanto contesto, intervento, avanzamento, esito e fonti.
- **Dalla scheda al caso**: i link delle schede progetto hanno `morph` (`TLink`): la foto della scheda cresce fino a riempire lo schermo e sfuma nell'apertura della pagina progetto. Gli altri link usano il piano blu diagonale.

## Sistema visivo

- **Tre tipi di azione e basta**: *primaria* (`Button`, `.vp-btn`: blocco pieno con l'estremità tagliata sull'inclinazione del simbolo, al massimo una per schermata: “Contatti” nell'header, “Scrivici”, “Candidati”, invio dei moduli); *secondaria* (`Cta`, `.vp-cta`: trattino che si allunga e testo); *link* (`.vp-ulink`: filo che si disegna da sinistra). Più due controlli: `.vp-iconbtn` (quadrato, precedente/successivo) e `.vp-tab` (schede e filtri, sottolineati). Niente pillole né cerchi.
- **Testo piccolo**: mai sotto 14 px; il secondario è un'opacità del navy (contrasto 6,3:1 sul bianco carta), non un grigio a parte.

## Movimento

Tre gesti, tutti disattivati con “riduci movimento”:

1. **Il taglio obliquo del simbolo** (99,655 / 170): massa dell'hero (su desktop resta ferma nel primo 12% dello scorrimento mentre il titolo esce, così la diagonale non taglia le parole), rivelazione delle immagini, transizioni di pagina, apertura del menu su telefono, banda navy al passaggio del mouse su schede e righe, riempimento del bottone primario.
2. **Foto più lente della pagina** (`ParallaxImage`, `ScrollProgress`).
3. **Righe di testo che salgono dalla loro maschera** (`data-reveal="lines"`).

Tolti di proposito: numeri che contano su importi e classifiche (contano solo i conteggi, 300+ e 30+), parole che si accendono, foto che segue il mouse, anteprima che segue il cursore nelle news, frecce che oscillano, team che entra in sequenza, fila dei progetti fissa con sole tre schede.

- Il tratto del simbolo è anche il segno di stato (`components/marks/Mark.tsx`): **pieno** = fatto documentato o fase conclusa, **contorno** = obiettivo dichiarato o fase prevista.
- Senza movimento o senza JavaScript tutto è nello stato finale.
- Curve: entrate `cubic-bezier(0.22, 1, 0.36, 1)`, movimenti `cubic-bezier(0.65, 0, 0.35, 1)`. Niente rimbalzi.
- Le animazioni d'ingresso si dichiarano nel markup (`data-reveal="lines" | "fade" | "image" | "rule" | "fill"`), dentro `<RevealScope>`.
- Le maschere delle righe hanno spazio sopra e sotto il testo, così accenti e discendenti (à, g, p) non vengono mai tagliati. Il controllo automatico lo verifica.

## Navigazione e accessibilità

- Il cursore di sistema resta sempre visibile.
- Ciò che aspetta la sua animazione d'ingresso è trasparente, non nascosto (`opacity`, non `visibility`): un lettore di schermo trova ogni titolo anche prima che sia stato scorso, e un blocco raggiunto da tastiera compare subito.
- I titoli dei testi pubblicati (news e annunci, che su WordPress partono da h4) sono rinumerati sotto l'h1 della pagina (`outline` in `lib/content.ts`): la struttura non ha salti e l'aspetto non cambia.
- Chi siamo: le tappe sono tutte in vista, senza nulla da trascinare; il team è diviso in schede (frecce sinistra/destra da tastiera). Il filtro delle news è un gruppo di pulsanti con stato premuto e un annuncio del numero di articoli.
- Le file da sfogliare contengono link raggiungibili da tastiera; nessun contenuto richiede il passaggio del mouse.
- Testi lunghi, email e link non escono mai dal loro riquadro, le ancore atterrano sotto l'header fisso.
- Controllo automatico usato in sviluppo: nessun testo tagliato, sovrapposto o fuori schermo e nessuno scroll orizzontale da 320 a 1920 px, in italiano e in inglese; 0 violazioni axe (WCAG 2.2 AA), con e senza movimento; nessun errore di idratazione.

## Da confermare con il gruppo prima della messa online

1. **Condovi**: nel sito attuale compare solo come intestazione di un gruppo del team (“Condovi – Condo management”). Il rapporto societario non è documentato, quindi il nuovo sito **non** lo presenta come società o divisione del gruppo: il team si chiama “Condo management”. Se il rapporto viene confermato, si aggiunge nella struttura del gruppo (`group.entities` nei dizionari).
2. **Immagini**: le foto indicative vanno sostituite con le foto del gruppo (elenco in **Scatti da fare o da chiedere**). Per i progetti: le tre immagini delle news (`genova.png`, l'immagine di Civitas 5, `asinari.png`) vanno verificate (che siano foto o render dei progetti, non ritagli di articoli) e scaricate in `public/` prima di spegnere WordPress; servono, se disponibili, una foto attuale di Corso Italia 30, render o foto di cantiere di Civitas 5, un'immagine del complesso di via Asinari.
3. **Immagini del vecchio sito**: anche news e ritratti del team sono caricati da `vitruviusandpartners.com/wp-content/uploads/`: vanno copiati in `public/`.
4. **Classifica Guamari 2023 (dati 2021)**: il comunicato di maggio 2023 indica il 42° posto, la news di giugno 2023 il 44°. Il sito non la riporta finché il dato non è confermato; usa solo 24° su 65 (2023) e 31° su 70 (2024).
5. **Esiti**: Civitas 5 mostra un obiettivo dichiarato (−50% di energia elettrica); se esiste un dato misurato a fine lavori, va inserito come esito documentato. Via Asinari: mancano dettagli pubblicati dell'intervento.
6. **Testi legali**: privacy e cookie policy (`privacyPage` nei dizionari) sono un testo provvisorio, da far redigere al consulente legale. La pagina è `noindex` finché non è definitiva.
7. **Team**: nel sito attuale compare “Barolyn Torres”, probabilmente un refuso (Carolyn?): verificare in `content-raw` e rigenerare.
8. **Email**: configurare Resend e verificare il dominio mittente.
9. **Altre operazioni**: con tre casi la sezione Progetti regge, ma è sottile. Servono altre operazioni documentate (vedi **Aggiungere un'operazione**).

## Deploy

Pensato per Vercel: collega il repository, imposta le variabili d'ambiente, aggiungi il dominio del deploy al kit Adobe Fonts. Nessun database.

- Header di sicurezza in `next.config.ts`: niente incorporamento in pagine altrui (`X-Frame-Options`, `frame-ancestors`), moduli inviati solo al sito, HSTS da Vercel.
- **Moduli senza Resend**: se l'invio non riesce (chiave mancante o servizio irraggiungibile) il visitatore vede l'errore e il link «Apri l'email già compilata», che apre il suo programma di posta con i campi scritti, ciascuno con la sua etichetta (`MailFallback` in `components/forms/Fields.tsx`); i file vanno allegati a mano.
