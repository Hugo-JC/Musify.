export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-surface-2 ${className ?? ''}`} />;
}

export function Message({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-16 text-center">
      <p className="text-base font-semibold">{title}</p>
      {hint && <p className="max-w-md text-sm text-muted">{hint}</p>}
    </div>
  );
}
