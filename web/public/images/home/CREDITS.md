# Crediti immagini della home — Vitruvius & Partners

Fotografie **indicative**, a colori, usate nella home finché il gruppo non fornisce le proprie. Nessuna ritrae un'opera del gruppo. Tutte hanno la Unsplash License (https://unsplash.com/license): uso commerciale gratuito, attribuzione non obbligatoria ma documentata qui. Sono state verificate una per una come «Free Photo», non Unsplash+.

**Trattamento unico.** Tutte passano da `tools/grade_colour.py`, la «luce naturale»:
- bilanciamento del bianco portato a metà verso il neutro, poi un bianco comune appena caldo;
- esposizione avvicinata a un unico grigio medio;
- saturazione leggermente contenuta;
- ombre verso il navy del marchio, luci verso un bianco carta caldo;
- nero opaco e una curva a S morbida.

Gli originali non trattati, ridimensionati a 2400 px, sono in `assets/stock/colour-src/`. Per rigenerare:

```
python3 -I tools/grade_colour.py assets/stock/colour-src web/public/images/home
```

La serie è scelta su un filo comune: sole caldo, intonaci ocra e terracotta, un tocco di azzurro.

### `home-hero-balconies.jpg` — apertura
- **Soggetto:** facciata residenziale contemporanea, griglia di balconi con piante, in luce calda (Copenaghen).
- **Autore / fonte:** heino eisner — https://unsplash.com/photos/ew8VnpgX9UI

### `home-vp-rooftops.jpg` — Sviluppare (Vitruvius & Partners)
- **Soggetto:** tetti in coppi e campanili di una città italiana, dall'alto.
- **Autore / fonte:** Simon Hurry — https://unsplash.com/photos/t7RADIlnhsI

### `home-construction-scaffolding.jpg` — Costruire (Vitruvius Construction)
- **Soggetto:** ponteggio su una facciata residenziale in lavorazione, cielo azzurro.
- **Autore / fonte:** Di — https://unsplash.com/photos/P6bOdzRk7TY

### `home-living-sunlit.jpg` — Valorizzare (Vitruvius Living)
- **Soggetto:** soggiorno luminoso con tende di lino e sole del mattino.
- **Autore / fonte:** Danilo Rios — https://unsplash.com/photos/AgK_XAqSbfk

### `home-contact-palazzo.jpg` — Proponi un immobile
- **Soggetto:** palazzo con intonaco terracotta e persiane verdi (Venezia).
- **Autore / fonte:** Florin Gorgan — https://unsplash.com/photos/k_UPzvGOlek
