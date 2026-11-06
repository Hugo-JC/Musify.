'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

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

export function ApiErrorAlert({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-4 rounded-card border border-red-500/40 bg-red-950/30 p-5 backdrop-blur-md sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
          <AlertCircle className="h-5 w-5 fill-red-500/10 stroke-[2.2]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-red-200">Não foi possível carregar as músicas da API</p>
          <p className="text-xs text-red-300/80">
            {message || 'A API do backend não respondeu com dados válidos. Verifica as credenciais e tenta de novo.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-on-accent shadow-md transition hover:opacity-90 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
          Recarregar
        </button>
      )}
    </div>
  );
}
