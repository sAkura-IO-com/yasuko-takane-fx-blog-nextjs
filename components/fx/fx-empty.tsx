import Link from "next/link";

export function FxEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="fx-empty">
      <h2 className="fx-empty-title">{title}</h2>
      {description ? <p className="fx-empty-text">{description}</p> : null}
      {action ? (
        <div className="fx-empty-actions">
          <Link href={action.href} className="fx-page-btn">
            {action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
