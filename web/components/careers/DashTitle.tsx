/**
 * A title with a dash ("Site Manager – Commesse…") that never starts a line with the dash: the
 * word before it and the dash are held together. A no-break space would not do, since the line
 * split of the reveal turns it back into a plain space; the reveal leaves `.vp-keep` whole.
 */
export function DashTitle({ text }: { text: string }) {
  // any space around the dash, the no-break one the postings already use included
  const m = text.match(/^(.*?)(\S+)\s+([–—-])\s+(.*)$/);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className="vp-keep whitespace-nowrap">
        {m[2]} {m[3]}
      </span>{" "}
      {m[4]}
    </>
  );
}
