import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="relative isolate overflow-hidden bg-[#eee4ff] px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-[8%] top-16 text-5xl text-white">🐾</div>
        <div className="absolute right-[10%] top-24 text-4xl text-white">🐾</div>
        <div className="absolute bottom-20 left-[16%] text-4xl text-white">🐾</div>
        <div className="absolute bottom-10 right-[18%] text-5xl text-white">🐾</div>
      </div>

      <section className="mx-auto flex min-h-[620px] w-full max-w-[1120px] items-center justify-center">
        <div className="relative w-full max-w-[470px] rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(105,78,145,0.18)] sm:px-10 sm:py-10">
          <div className="absolute -left-5 top-8 h-9 w-20 -rotate-12 rounded-md bg-[#ffd66b]/80" />
          <div className="absolute -right-4 bottom-10 h-9 w-20 rotate-12 rounded-md bg-[#ffd66b]/80" />

          <Link to="/" className="mx-auto mb-5 flex w-fit justify-center">
            <img src="/assets/logo/ngang.png" alt="PawWorld" className="h-12 w-auto" />
          </Link>

          <div className="mb-7 text-center">
            <h1 className="crayon text-[38px] leading-tight text-cocoa-600 sm:text-[46px]">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm font-semibold text-cocoa-400">{subtitle}</p> : null}
          </div>

          {children}
          {footer ? <div className="mt-6 text-center text-sm font-semibold text-cocoa-400">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
