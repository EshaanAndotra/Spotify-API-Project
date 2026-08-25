/**
 * Page-level title block, rendered in the page wrapper above the content card.
 * Keeps headings consistent across routes and frees the component cards from
 * carrying their own titles.
 */
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-zinc-500 max-w-prose">{subtitle}</p>
      )}
    </header>
  );
}
