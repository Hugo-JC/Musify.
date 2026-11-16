import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./GoogleIcon";
import { signInWithProvider } from "@/lib/authMfaFlow";
import { returnToSearch } from "@/lib/authReturnTo";

// Small pieces the auth pages share.

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl bg-red-500/10 p-3 text-[12.5px] text-red-300">
      {children}
    </div>
  );
}

export function SubmitButton({ busy, busyLabel, children, ...props }) {
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-full text-[13px] font-semibold shadow-[0_16px_34px_-18px_rgba(237,23,64,0.5)] transition-all duration-400 ease-organic hover:scale-[1.01]"
      disabled={busy}
      {...props}
    >
      {busy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function GoogleButton({ returnTo, onError }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="mb-6 h-12 w-full rounded-full border-0 bg-musify-hover/60 text-[13px] font-semibold text-musify-text transition-all duration-400 ease-organic hover:bg-musify-hover"
      onClick={() => signInWithProvider("google", returnTo).catch((err) => onError(err.message || "Não foi possível entrar com o Google"))}
    >
      <GoogleIcon className="mr-2 h-5 w-5" />
      Continuar com o Google
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
        <div className="h-px w-full bg-white/8" />
      </div>
      <div className="relative flex justify-center text-[10.5px] uppercase tracking-[0.16em]">
        <span className="bg-musify-surface px-3 text-musify-dim">ou</span>
      </div>
    </div>
  );
}

// A link between auth screens that carries the way back (?returnTo=) along.
export function AuthLink({ to, returnTo, className = "font-semibold text-musify-accent hover:underline", children }) {
  return (
    <Link to={to} search={returnToSearch(returnTo)} className={className}>
      {children}
    </Link>
  );
}