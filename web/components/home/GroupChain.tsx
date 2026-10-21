import { TLink } from "@/components/layout/PageTransition";
import { Mark } from "@/components/marks/Mark";
import { Cta } from "@/components/ui/Cta";
import { ParallaxImage } from "@/components/ui/ParallaxImage";

export type Step = {
  key: string;
  verb: string;
  name: string;
  kind: string;
  text: string;
  image: string;
  href: string;
  linkLabel: string;
  external: boolean;
  proof: { value: string; unit: string; label: string; href?: string; linkLabel?: string };
};

/**
 * The group as a sequence: develop → build → add value. Each step names who does it,
 * says it in one sentence and backs it with one published fact. Everything is readable
 * at rest: no hover is needed. Phones and tablets read the three steps down the page
 * (the projects below are the only row that swipes); wide screens see all three side by side.
 */
export function GroupChain({ steps, externalNote, label }: { steps: Step[]; externalNote: string; label: string }) {
  return (
    <ol className="vp-chain container-x" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.key} className="vp-chain__step">
          <p className="vp-chain__head t-label t-num" aria-hidden="true">
            <span className="text-[var(--fg)]">{String(i + 1).padStart(2, "0")}</span>
            <span className="vp-chain__rule" />
            <span className="vp-chain__arrow">{i < steps.length - 1 ? "→" : ""}</span>
          </p>
          <div className="vp-chain__img" data-reveal="image">
            <ParallaxImage src={s.image} alt="" sizes="(min-width: 1024px) 31vw, 78vw" strength={6} className="absolute inset-0" />
          </div>
          <h3 className="vp-chain__verb">{s.verb}</h3>
          <p className="t-body mt-2">
            {s.name} <span className="text-[var(--fg-2)]">· {s.kind}</span>
          </p>
          <p className="t-body-l mt-4 max-w-[30ch]">{s.text}</p>
          <div className="pt-7">
            <div className="border-t border-[var(--line)] pt-5">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Mark className="text-[var(--fg)]" />
                <span className="vp-chain__fig t-num">{s.proof.value}</span>
                <span className="t-small">{s.proof.unit}</span>
              </p>
              <p className="t-small mt-2 text-[var(--fg-2)]">
                {s.proof.label}
                {s.proof.href ? (
                  <>
                    {" · "}
                    <TLink href={s.proof.href} className="vp-ulink text-[var(--fg)]">
                      {s.proof.linkLabel}
                    </TLink>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Cta href={s.href} external={s.external} externalNote={externalNote} transitionLabel={s.linkLabel}>
              {s.linkLabel}
            </Cta>
          </div>
        </li>
      ))}
    </ol>
  );
}
