// Full-screen card shared by the auth pages; it sets its own color tokens so it stays readable under any theme.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-musify-bg px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-musify-accent/14 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#2b7bd6]/10 blur-[120px]" />

      <div className="relative w-full max-w-[418px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[linear-gradient(150deg,#ff5a72,#c90e32)] shadow-[0_12px_28px_-14px_rgba(237,23,64,0.8)]">
            <span className="flex items-end gap-[3px]">
              {[11, 16, 9, 14].map((height, index) => (
                <span key={index} className="w-[3px] rounded-full bg-[#2a0309]" style={{ height: `${height}px` }} />
              ))}
            </span>
          </span>
          <span className="font-display text-[19px] font-semibold tracking-tight text-musify-text">
            Mus<span className="text-musify-accent">fy</span>
          </span>
        </div>

        <div className="rounded-[24px] bg-musify-surface p-7 shadow-[0_46px_100px_-60px_rgba(0,0,0,1)] sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            {Icon && (
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-musify-hover">
                <Icon className="h-4 w-4 text-musify-accent" aria-hidden="true" />
              </span>
            )}
            <div>
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-musify-text">
                {title}
              </h1>
              {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-musify-dim">{subtitle}</p>}
            </div>
          </div>

          {children}
        </div>

        {footer && <p className="mt-6 text-center text-[12px] text-musify-dim">{footer}</p>}
      </div>
    </div>
  );
}