import type { ReactNode } from "react";

/** Label · rule · index — the brand book's page header device — plus a title. */
export function SectionHead({
  label,
  index,
  title,
  id,
  as: Tag = "h2",
  titleClass = "t-l",
  children,
}: {
  label: string;
  index?: string;
  title: ReactNode;
  id?: string;
  as?: "h1" | "h2";
  titleClass?: string;
  children?: ReactNode;
}) {
  return (
    <header>
      <p className="t-label mb-6 flex items-center gap-3" data-reveal="fade">
        <span>{label}</span>
        {index && (
          <>
            <span aria-hidden="true" className="h-px w-10 bg-current opacity-40" />
            <span>{index}</span>
          </>
        )}
      </p>
      <Tag id={id} className={`${titleClass} max-w-[18ch]`} data-reveal="lines">
        {title}
      </Tag>
      {children}
    </header>
  );
}
