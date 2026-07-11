export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  const classes = active
    ? "border-data bg-data-soft text-data"
    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm font-medium ${classes}`}
    >
      {label}
    </button>
  );
}
