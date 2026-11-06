'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ExternalLink, KeyRound, LogOut, Music2, ShieldCheck, Sparkles, Youtube } from 'lucide-react';
import { Cover } from '@/components/ui/Cover';
import { Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api';
import type { YouTubeAccount } from '@/types';

function AccountContent() {
  const searchParams = useSearchParams();
  const notice = searchParams.get('youtube');
  const [account, setAccount] = useState<YouTubeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadAccount = async () => {
    try {
      const data = await api.account();
      setAccount(data);
    } catch {
      setAccount({ connected: false, channel: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount();
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectAccount();
      await loadAccount();
    } catch {
      /* ignore */
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const isConnected = account?.connected && account.channel;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-12">
      <div>
        <h1 className="text-[32px] font-bold leading-tight">Conta YouTube</h1>
        <p className="mt-1 text-sm text-muted">
          Gere a ligação da tua conta oficial do YouTube para recomendações personalizadas e acesso verificado.
        </p>
      </div>

      {notice === 'connected' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Conta YouTube associada com sucesso! As tuas recomendações estão agora ativas.</span>
        </div>
      )}

      {notice === 'exchange_error' && (
        <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
          Erro ao trocar o código OAuth com a Google. Confirma se as credenciais do Google Cloud estão corretas.
        </div>
      )}

      {notice === 'cancelled' && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200">
          Autenticação cancelada pelo utilizador.
        </div>
      )}

      {isConnected ? (
        <div className="flex flex-col gap-6 rounded-card border border-line bg-surface-2 p-8 shadow-xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-5">
              <Cover
                src={account.channel?.thumbnail || undefined}
                alt={account.channel?.title || 'YouTube'}
                round
                className="h-20 w-20 text-2xl shadow-lg ring-2 ring-accent"
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{account.channel?.title}</h2>
                  <span
                    title="Canal Verificado via Google OAuth"
                    className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 fill-current" />
                    Verificado
                  </span>
                </div>
                <p className="text-xs text-muted">ID do canal: {account.channel?.id}</p>
                <a
                  href={`https://www.youtube.com/channel/${account.channel?.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  Ver no YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <button
              type="button"
              disabled={disconnecting}
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-semibold text-white/90 transition hover:border-red-500 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Desconectar Conta
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-line sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Recomendações ativas</p>
                <p className="mt-0.5 text-xs text-muted">
                  A página inicial agora apresenta faixas inspiradas nas músicas que gostaste no teu canal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold">Acesso Oficial e Seguro</p>
                <p className="mt-0.5 text-xs text-muted">
                  Autenticação direta através do escopo oficial de leitura da Google (youtube.readonly).
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 rounded-card border border-line bg-surface-2 p-8 shadow-xl">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent">
              <Youtube className="h-9 w-9 fill-current" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Ligar Conta do YouTube</h2>
              <p className="mt-1 text-sm text-muted">
                Inicia sessão com a tua conta do YouTube para obter recomendações automáticas a partir das tuas músicas favoritas e playlists guardadas.
              </p>
            </div>
            <a
              href="/api/auth/youtube/login"
              className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-lg transition hover:scale-105 active:scale-95"
            >
              <Youtube className="h-5 w-5 fill-current" />
              Conectar com YouTube
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-6 border-t border-line md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Music2 className="h-4 w-4 text-accent" />
                Músicas e Gostos
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Carrega as faixas marcadas com «Gosto» na tua conta para alimentar o feed «Made For You».
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-accent" />
                API Oficial Google
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Utiliza OAuth 2.0 padrão da Google com permissões estritamente restritas a leitura (<code className="text-[10px] text-accent">youtube.readonly</code>).
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <KeyRound className="h-4 w-4 text-accent" />
                Configuração Simples
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Basta definir as variáveis <code className="text-[10px]">GOOGLE_CLIENT_ID</code> e <code className="text-[10px]">GOOGLE_CLIENT_SECRET</code> no ficheiro <code className="text-[10px]">.env</code> do backend.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AccountContent />
    </Suspense>
  );
}
