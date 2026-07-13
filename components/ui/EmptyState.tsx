export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  /** Show the soft concentric circle mascot graphic above the text. */
  graphic?: boolean;
}

export function EmptyState({ title, subtitle, graphic = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      {graphic && (
        <div
          aria-hidden="true"
          className="flex h-24 w-24 items-center justify-center rounded-full bg-ingredient-soft"
        >
          <span className="h-10 w-10 rounded-full bg-brand-soft" />
        </div>
      )}
      <p className="font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
