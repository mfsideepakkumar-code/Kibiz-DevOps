// Standard page heading: 500-weight title, muted description, actions on the
// right. Keeps screens to the two allowed font weights (400/500).
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-lg font-medium">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
