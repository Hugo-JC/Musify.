import { Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { safeReturnTo } from "@/lib/authReturnTo";

const isAlreadyVerified = (err) => err?.status === 400 && /already verified/i.test(err?.message ?? "");

/**
 * The /register page: register → OTP → verifyOtp → setToken. Registration alone
 * does not sign the user in (the account is unverified), so the code step is never
 * skipped and loginViaEmailPassword is never called right after register.
 */
export function RegisterPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  async function register(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As palavras-passe não coincidem");
      return;
    }
    setBusy(true);
    try {
      await base44.auth.register({ email, password });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = returnTo;
    } catch (err) {
      // Verified server-side but the answer never arrived: the code is spent and
      // there is no token, so the only way forward is a normal sign-in.
      if (isAlreadyVerified(err)) setStep("already_verified");
      else setError(err.message || "Código de verificação inválido");
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast("Código enviado", { description: "Verifica o teu email para o novo código." });
    } catch (err) {
      if (isAlreadyVerified(err)) setStep("already_verified");
      else setError(err.message || "Não foi possível reenviar o código");
    }
  }

  // The account is verified; the second sign-in step replaces the whole page and finishes signing in.
  if (mfaChallenge) return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;

  if (step === "already_verified") {
    return (
      <AuthLayout icon={UserPlus} title="Cria a tua conta" subtitle="Leva menos de um minuto e a música começa já.">
        <p className="mb-4 text-[12.5px] leading-relaxed text-musify-dim">
          <span className="font-semibold text-musify-text">{email}</span> já está verificado. Entra para continuar.
        </p>
        <AuthLink to="/login" returnTo={returnTo} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-musify-accent text-[13px] font-semibold text-white hover:bg-musify-accent-strong">
          Entrar
        </AuthLink>
      </AuthLayout>
    );
  }

  if (step === "otp") {
    return (
      <AuthLayout icon={UserPlus} title="Cria a tua conta" subtitle="Leva menos de um minuto e a música começa já.">
        <form onSubmit={verify}>
          <p className="mb-4 text-[12.5px] leading-relaxed text-musify-dim">
            Enviámos um código de 6 dígitos para <span className="font-semibold text-musify-text">{email}</span>.
          </p>
          <AuthError>{error}</AuthError>
          <div className="mb-6 flex justify-center">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <SubmitButton busy={busy} busyLabel="A verificar..." disabled={busy || otpCode.length < 6}>
            Verificar
          </SubmitButton>
          <p className="mt-4 text-center text-[12px] text-musify-dim">
            Não recebeste o código?{" "}
            <button type="button" onClick={resend} className="font-semibold text-musify-accent hover:underline">
              Reenviar
            </button>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Cria a tua conta" subtitle="Leva menos de um minuto e a música começa já.">
      <GoogleButton returnTo={returnTo} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={register} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-email" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-musify-dim" aria-hidden="true" />
            <Input id="register-email" type="email" autoComplete="email" autoFocus placeholder="o.teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-0 bg-musify-hover/55 pl-10 text-[13px] text-musify-text placeholder:text-musify-dim/60 focus-visible:ring-1 focus-visible:ring-musify-accent/50" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim">
            Palavra-passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-musify-dim" aria-hidden="true" />
            <Input id="register-password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-0 bg-musify-hover/55 pl-10 text-[13px] text-musify-text placeholder:text-musify-dim/60 focus-visible:ring-1 focus-visible:ring-musify-accent/50" disabled={busy} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim">
            Confirmar palavra-passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-musify-dim" aria-hidden="true" />
            <Input id="register-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-xl border-0 bg-musify-hover/55 pl-10 text-[13px] text-musify-text placeholder:text-musify-dim/60 focus-visible:ring-1 focus-visible:ring-musify-accent/50" disabled={busy} required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="A criar conta...">
          Criar conta
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-[12.5px] text-musify-dim">
        Já tens conta?{" "}
        <AuthLink to="/login" returnTo={returnTo}>
          Entrar
        </AuthLink>
      </p>
    </AuthLayout>
  );
}