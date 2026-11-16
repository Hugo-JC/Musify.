import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { loginWithMfa } from "@/lib/authMfa";
import { safeReturnTo } from "@/lib/authReturnTo";

// The /login page. ?returnTo= (or the platform's ?from_url=) is where the visitor
// goes after signing in — the login gate and the MCP consent page send people here with it.
export function LoginPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await loginWithMfa(email, password);
      if (result.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      // A hard redirect: the app re-initializes with the new session.
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Email ou palavra-passe inválidos");
      setBusy(false);
    }
  }

  // The second sign-in step (authenticator app or text message) replaces the whole page.
  if (mfaChallenge) return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;

  return (
    <AuthLayout icon={LogIn} title="Bem-vindo de volta" subtitle="Entra para continuares a ouvir a tua música.">
      <GoogleButton returnTo={returnTo} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-musify-dim" aria-hidden="true" />
            <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder="o.teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-0 bg-musify-hover/55 pl-10 text-[13px] text-musify-text placeholder:text-musify-dim/60 focus-visible:ring-1 focus-visible:ring-musify-accent/50" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim">
              Palavra-passe
            </Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-[11px] font-semibold text-musify-dim transition-colors hover:text-musify-text">
              Esqueci-me
            </AuthLink>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-musify-dim" aria-hidden="true" />
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-0 bg-musify-hover/55 pl-10 text-[13px] text-musify-text placeholder:text-musify-dim/60 focus-visible:ring-1 focus-visible:ring-musify-accent/50" required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="A entrar...">
          Entrar
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-[12.5px] text-musify-dim">
        Ainda não tens conta?{" "}
        <AuthLink to="/register" returnTo={returnTo}>
          Criar conta
        </AuthLink>
      </p>
    </AuthLayout>
  );
}