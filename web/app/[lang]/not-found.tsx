import { Cta } from "@/components/ui/Cta";
import { dictionaryFor } from "@/lib/content";

// Rendered for unknown paths inside a locale. Uses Italian copy with English below.
export default function NotFound() {
  const it = dictionaryFor("it");
  const en = dictionaryFor("en");
  return (
    <section data-theme="paper" className="container-x flex min-h-[80svh] flex-col justify-end pb-24 pt-40">
      <p className="t-label mb-6">404</p>
      <h1 className="t-xl max-w-[16ch]">{it.notFound.title}</h1>
      <p className="t-body-l mt-6 max-w-[40ch] text-[var(--fg-2)]">
        {it.notFound.text}
        <br />
        <span lang="en">{en.notFound.text}</span>
      </p>
      <div className="mt-10 flex gap-10">
        <Cta href="/">{it.notFound.cta}</Cta>
        <Cta href="/en">{en.notFound.cta}</Cta>
      </div>
    </section>
  );
}
