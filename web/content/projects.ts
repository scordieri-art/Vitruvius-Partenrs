import type { Locale } from "@/lib/i18n";

/**
 * The group's documented operations.
 *
 * Every statement below comes from a source the group has published (its own
 * News & Press, or the press articles it links). Nothing is extrapolated:
 * where a result has not been published, the case says what stage it has
 * reached instead. Figures carry their nature:
 *   - "documented": a published fact (a price, a count, a date)
 *   - "target":     a declared objective, not a measured result
 *
 * Images: `image` is the photograph or render published by the group in the
 * news of each case. Under it sits `placeholder`, a free stock photograph that
 * is always labelled "indicative image": it shows only where the published one
 * cannot load (e.g. the preview, which cannot reach the WordPress host).
 */
type L = Record<Locale, string>;

export type FigureKind = "documented" | "target";
export type Figure = { value: string; unit: L; label: L; kind: FigureKind };
export type Stage = { label: L; when: L; done: boolean };
export type Outcome = { kind: "documented" | "target" | "status"; text: L };

export type Project = {
  slug: { it: string; en: string };
  name: string;
  place: L;
  address: L;
  year: string;
  composition: "landscape" | "quote" | "data";
  role: L;
  status: L;
  summary: L;
  context: L;
  challenge: L;
  contribution: L;
  capabilities: Record<Locale, string[]>;
  partners?: L;
  outcome: Outcome;
  figures: Figure[];
  stages: Stage[];
  quote?: { text: L; author: string; role: L; source: L };
  /** published by the group (shown on the live site) */
  image?: { src: string; alt: L; caption: L };
  /** indicative stock photograph under the published one, always labelled as such */
  placeholder: string;
  newsSlug: { it: string; en?: string };
  sources: { label: string; url: string; date: L }[];
};

export const projects: Project[] = [
  {
    slug: { it: "palazzo-ex-inps-genova", en: "former-inps-palace-genoa" },
    name: "Palazzo ex INPS",
    place: { it: "Genova", en: "Genoa" },
    address: { it: "Corso Italia 30, Genova", en: "Corso Italia 30, Genoa" },
    year: "2026",
    composition: "landscape",
    role: { it: "Acquisizione e sviluppo", en: "Acquisition and development" },
    status: { it: "Acquisizione aggiudicata", en: "Acquisition awarded" },
    summary: {
      it: "Uno degli edifici simbolo del lungomare genovese, aggiudicato in una procedura competitiva: 21 appartamenti da ristrutturare e una destinazione ancora da scegliere.",
      en: "One of the landmark buildings on Genoa’s seafront, awarded in a competitive procedure: 21 apartments to renovate and a future use still to be chosen.",
    },
    context: {
      it: "Corso Italia 30, a pochi passi dal mare e affacciato sull’Abbazia di San Giuliano. Da decenni il palazzo è un punto di riferimento architettonico della città.",
      en: "Corso Italia 30, a few steps from the sea and overlooking the Abbey of San Giuliano. For decades the palace has been an architectural landmark of the city.",
    },
    challenge: {
      it: "Un immobile di pregio composto da 21 appartamenti di ampia metratura, che richiedono un significativo intervento di ristrutturazione prima di qualsiasi nuova destinazione.",
      en: "A prestigious building of 21 large apartments, which need a significant renovation before any new use.",
    },
    contribution: {
      it: "Vitruvius & Partners si è aggiudicata l’edificio nella procedura competitiva promossa da Invimit SGR, per un valore complessivo di 15,87 milioni di euro. La destinazione sarà definita nelle prossime fasi progettuali: tra le ipotesi, residenze di alto livello o una struttura ricettiva di prestigio, tra il mare e il centro.",
      en: "Vitruvius & Partners was awarded the building in the competitive procedure promoted by Invimit SGR, for a total value of €15.87 million. Its use will be defined in the next design phases: options include high-end residences or a prestigious hospitality venue, between the sea and the city centre.",
    },
    capabilities: {
      it: ["Acquisizione", "Sviluppo immobiliare", "Rigenerazione urbana"],
      en: ["Acquisition", "Real estate development", "Urban regeneration"],
    },
    outcome: {
      kind: "documented",
      text: {
        it: "Acquisizione aggiudicata per 15,87 milioni di euro. Il rogito definitivo è previsto entro dodici mesi dall’annuncio.",
        en: "Acquisition awarded for €15.87 million. The final deed is expected within twelve months of the announcement.",
      },
    },
    figures: [
      { value: "15,87", unit: { it: "milioni di euro", en: "€ million" }, label: { it: "Valore dell’operazione", en: "Transaction value" }, kind: "documented" },
      { value: "21", unit: { it: "appartamenti", en: "apartments" }, label: { it: "Di ampia metratura, da ristrutturare", en: "Large units, to be renovated" }, kind: "documented" },
    ],
    stages: [
      { label: { it: "Aggiudicazione", en: "Award" }, when: { it: "Luglio 2026", en: "July 2026" }, done: true },
      { label: { it: "Rogito definitivo", en: "Final deed" }, when: { it: "Entro 12 mesi", en: "Within 12 months" }, done: false },
      { label: { it: "Destinazione e progetto", en: "Use and design" }, when: { it: "Prossime fasi", en: "Next phases" }, done: false },
    ],
    image: {
      src: "https://vitruviusandpartners.com/wp-content/uploads/2026/07/genova.png",
      alt: { it: "Il Palazzo ex INPS di Corso Italia, Genova", en: "The former INPS palace on Corso Italia, Genoa" },
      caption: { it: "Immagine pubblicata da Vitruvius & Partners, luglio 2026", en: "Image published by Vitruvius & Partners, July 2026" },
    },
    placeholder: "/images/placeholder/residential-bw-balconies-raking-light-03.jpg",
    newsSlug: { it: "palazzo-ex-inps-di-corso-italia-vitruvius-partners-acquisisce-uno-degli-immobili-piu-prestigiosi-di-genova" },
    sources: [
      {
        label: "Il Secolo XIX",
        url: "https://www.ilsecoloxix.it/genova/news/palazzo-ex-inps-di-corso-italia-venduto-per-16-milioni-a-una-societa-milanese-tpjoiu1n/",
        date: { it: "Luglio 2026", en: "July 2026" },
      },
    ],
  },
  {
    slug: { it: "via-asinari-asti", en: "via-asinari-asti" },
    name: "Via Asinari",
    place: { it: "Asti", en: "Asti" },
    address: { it: "Complesso residenziale, Asti", en: "Residential complex, Asti" },
    year: "2025",
    composition: "quote",
    role: { it: "Investimento e rinascita del complesso", en: "Investment and revival of the complex" },
    status: { it: "Operazione annunciata", en: "Operation announced" },
    summary: {
      it: "Nella città dei fondatori, il gruppo si occuperà della rinascita di un complesso residenziale: un’operazione che Vittorio Ligresti definisce «sentimentale ed estetica».",
      en: "In its founders’ city, the group will lead the revival of a residential complex: an operation Vittorio Ligresti calls “sentimental and aesthetic”.",
    },
    context: {
      it: "Asti è la città di Vittorio Ligresti e di Luca Limone, che nel 2020 hanno fondato la società. Qui il gruppo ha una delle sue due sedi.",
      en: "Asti is the home town of Vittorio Ligresti and Luca Limone, who founded the company in 2020. It is also where the group has one of its two offices.",
    },
    challenge: {
      it: "Dare una nuova vita a un complesso residenziale esistente.",
      en: "Giving an existing residential complex a new life.",
    },
    contribution: {
      it: "Vitruvius & Partners guida l’operazione. Per La Stampa segna anche un passaggio del gruppo: dalle grandi commesse edilizie e di riqualificazione energetica a nuovi spazi di investimento.",
      en: "Vitruvius & Partners leads the operation. For La Stampa it also marks a step for the group: from large construction and energy-requalification contracts to new areas of investment.",
    },
    capabilities: {
      it: ["Investimento", "Riqualificazione residenziale"],
      en: ["Investment", "Residential requalification"],
    },
    outcome: {
      kind: "status",
      text: {
        it: "Operazione annunciata a marzo 2025. I dettagli dell’intervento non sono ancora stati pubblicati.",
        en: "Operation announced in March 2025. Details of the works have not been published yet.",
      },
    },
    figures: [],
    stages: [
      { label: { it: "Annuncio", en: "Announcement" }, when: { it: "Marzo 2025", en: "March 2025" }, done: true },
      { label: { it: "Prossime fasi", en: "Next phases" }, when: { it: "Da comunicare", en: "To be announced" }, done: false },
    ],
    quote: {
      text: {
        it: "Investire nella propria città non è solamente un’operazione commerciale: è anche un fatto simbolico e affettivo.",
        en: "Investing in your own city is not only a commercial operation: it is also a symbolic and emotional act.",
      },
      author: "Vittorio Ligresti",
      role: { it: "Co-fondatore", en: "Co-founder" },
      source: { it: "La Stampa, 21 marzo 2025", en: "La Stampa, 21 March 2025" },
    },
    image: {
      src: "https://vitruviusandpartners.com/wp-content/uploads/2025/03/asinari.png",
      alt: { it: "Via Asinari, Asti", en: "Via Asinari, Asti" },
      caption: { it: "Immagine pubblicata da Vitruvius & Partners, marzo 2025", en: "Image published by Vitruvius & Partners, March 2025" },
    },
    placeholder: "/images/placeholder/residential-white-modular-facade-01.jpg",
    newsSlug: { it: "la-stampa-asti-la-rinascita-di-via-asinari-unoperazione-sentimentale-ed-estetica" },
    sources: [
      {
        label: "La Stampa",
        url: "https://www.lastampa.it/asti/2025/03/21/news/asti_rinascita_asinari_operazione_sentimentale_estetica-15063023/",
        date: { it: "Marzo 2025", en: "March 2025" },
      },
    ],
  },
  {
    slug: { it: "civitas-5-airuno", en: "civitas-5-airuno" },
    name: "Civitas 5",
    place: { it: "Airuno (LC)", en: "Airuno (LC)" },
    address: { it: "Airuno, provincia di Lecco", en: "Airuno, province of Lecco" },
    year: "2023",
    composition: "data",
    role: { it: "Progettazione, coordinamento ed esecuzione", en: "Design, coordination and delivery" },
    status: { it: "Riqualificazione avviata", en: "Requalification started" },
    summary: {
      it: "Tre palazzine e 58 appartamenti in Brianza, ripensati per intero. L’obiettivo dichiarato: dimezzare il consumo di energia elettrica dell’intero complesso.",
      en: "Three buildings and 58 apartments in Brianza, entirely rethought. The declared objective: halving the electricity consumption of the whole complex.",
    },
    context: {
      it: "Airuno, in provincia di Lecco: a due passi dal Lago di Como e a meno di un’ora da Milano, nel paesaggio suburbano della Brianza. Edifici che cominciano a mostrare i segni del tempo.",
      en: "Airuno, in the province of Lecco: a short distance from Lake Como and less than an hour from Milan, in the suburban landscape of Brianza. Buildings beginning to show their age.",
    },
    challenge: {
      it: "Ristrutturare completamente, in chiave eco-sostenibile, un’area residenziale di 3 palazzine e 58 appartamenti, riducendo consumi ed emissioni.",
      en: "Completely renovating, sustainably, a residential area of 3 buildings and 58 apartments, cutting consumption and emissions.",
    },
    contribution: {
      it: "Progettazione e coordinamento di Vitruvius & Partners con l’architetto Fabio Panzeri e il suo team di rigenerazione urbana; esecuzione con maestranze specializzate. Interni in pietra e legno, facciate in materiali naturali con vegetazione. Serramenti ad alte prestazioni termiche e acustiche, fotovoltaico, eolico con accumulo e colonnine di ricarica.",
      en: "Design and coordination by Vitruvius & Partners with architect Fabio Panzeri and his urban-regeneration team; delivery with specialised crews. Interiors in stone and wood, facades in natural materials with planting. High-performance thermal and acoustic windows, photovoltaics, wind power with storage and EV charging points.",
    },
    capabilities: {
      it: ["Riqualificazione energetica", "Progettazione e coordinamento", "Esecuzione"],
      en: ["Energy requalification", "Design and coordination", "Delivery"],
    },
    partners: { it: "Panzeri Architetti, arch. Fabio Panzeri", en: "Panzeri Architetti, architect Fabio Panzeri" },
    outcome: {
      kind: "target",
      text: {
        it: "Obiettivo dichiarato: −50% di consumo di energia elettrica per l’intero complesso, con una sensibile riduzione delle emissioni di CO₂. Il risultato misurato non è ancora stato pubblicato.",
        en: "Declared objective: −50% electricity consumption for the whole complex, with a significant cut in CO₂ emissions. The measured result has not been published yet.",
      },
    },
    figures: [
      { value: "10+", unit: { it: "milioni di euro", en: "€ million" }, label: { it: "Valore dell’appalto", en: "Contract value" }, kind: "documented" },
      { value: "58", unit: { it: "appartamenti", en: "apartments" }, label: { it: "In 3 palazzine", en: "In 3 buildings" }, kind: "documented" },
      { value: "−50%", unit: { it: "di energia elettrica", en: "electricity" }, label: { it: "Consumo dell’intero complesso", en: "Consumption of the whole complex" }, kind: "target" },
    ],
    stages: [
      { label: { it: "Appalto annunciato", en: "Contract announced" }, when: { it: "Dicembre 2022", en: "December 2022" }, done: true },
      { label: { it: "Avvio della riqualificazione", en: "Requalification started" }, when: { it: "Maggio 2023", en: "May 2023" }, done: true },
      { label: { it: "Completamento", en: "Completion" }, when: { it: "Da documentare", en: "To be documented" }, done: false },
    ],
    quote: {
      text: {
        it: "Riqualificare significa valorizzare: dal punto di vista ambientale, economico, estetico.",
        en: "Requalifying means adding value: environmentally, economically, aesthetically.",
      },
      author: "Vitruvius & Partners",
      role: { it: "News del progetto", en: "Project news" },
      source: { it: "Maggio 2023", en: "May 2023" },
    },
    image: {
      src: "https://vitruviusandpartners.com/wp-content/uploads/2023/05/immagine-2-progetto-Civitas5-Airuno-VitruviusPartners2.jpg",
      alt: { it: "Il progetto Civitas 5 ad Airuno", en: "The Civitas 5 project in Airuno" },
      caption: { it: "Immagine di progetto pubblicata da Vitruvius & Partners, maggio 2023", en: "Project image published by Vitruvius & Partners, May 2023" },
    },
    placeholder: "/images/placeholder/residential-stepped-white-balconies-02.jpg",
    newsSlug: {
      it: "edilizia-sostenibile-appalto-da-oltre-10-milioni-di-euro-per-unarea-residenziale-a-prova-di-bolletta-nel-cuore-della-brianza",
      en: "sustainable-construction-contract-worth-over-10-million-euros-for-an-energy-efficient-residential-area-in-the-heart-of-brianza",
    },
    sources: [
      { label: "Agi", url: "https://www.agi.it/economia/news/2022-12-08/airuno-brianza-costruzione-isolato-a-prova-di-bolletta-19114167/", date: { it: "Dicembre 2022", en: "December 2022" } },
      { label: "Il Corriere Nazionale", url: "https://www.corrierenazionale.net/2022/12/09/in-brianza-stanno-costruendo-un-isolato-a-prova-di-bolletta/", date: { it: "Dicembre 2022", en: "December 2022" } },
      { label: "Affaritaliani.it", url: "https://www.affaritaliani.it/economia/edilizia-sostenibile-appalto-da-10-milioni-per-isolato-a-prova-di-bolletta-828279.html", date: { it: "Dicembre 2022", en: "December 2022" } },
      { label: "Il Globo", url: "https://ilglobo.com/news/in-brianza-stanno-costruendo-un-isolato-a-prova-di-bolletta-87145/", date: { it: "Dicembre 2022", en: "December 2022" } },
      { label: "Pledge Times", url: "https://pledgetimes.com/sustainable-construction-bill-proof-contract-worth-10-million-per-block/", date: { it: "Dicembre 2022", en: "December 2022" } },
    ],
  },
];

export const findProject = (lang: Locale, slug: string) => projects.find((p) => p.slug[lang] === slug);
