# File dal sito precedente del gruppo

Immagini e documenti che il sito precedente (WordPress, vitruviusandpartners.com/wp-content/uploads)
pubblicava e che le pagine nuove usano ancora: copertine e immagini delle news, le foto delle tre
operazioni, i certificati ISO 9001. Sono materiale del gruppo, ripreso così com'era.

- **Come arrivano qui:** `NODE_USE_ENV_PROXY=1 node scripts/legacy-images.mjs` (dopo `scripts/build-content.mjs`).
  Lo script legge gli indirizzi nelle news e in `content/projects.ts` e `content/site.ts`, scarica i file,
  riduce le immagini a 2400 px sul lato lungo (una copertina era un originale da 18 MB), lascia i PDF come sono,
  e scrive `content/generated/legacy-files.json` (vecchio indirizzo → file qui).
- **Dove si usano:** le news passano dalla mappa in `lib/content.ts` (copertina e immagini nel testo);
  progetti e certificati puntano direttamente ai file in `public/legacy/`.
- **Nomi:** gli stessi del sito precedente, con anno e mese della cartella d'origine; caratteri non ASCII sostituiti.
- Quando arriveranno le foto originali ad alta risoluzione, si sostituiscono qui o in `content/projects.ts`.
