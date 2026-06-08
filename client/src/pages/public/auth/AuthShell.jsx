const OBJECTS = '/assets/icon/khac/OBJECTS.svg';
const OBJECTS_1 = '/assets/icon/khac/OBJECTS1.svg';
const PAW_PATTERN = '/assets/icon/khac/pets.svg';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <section className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#ecd8ff] px-4 py-9 md:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <img src={PAW_PATTERN} alt="" className="absolute left-1/2 top-6 w-[680px] max-w-none -translate-x-1/2 opacity-45 mix-blend-soft-light" />
        <img src={OBJECTS} alt="" className="absolute -left-12 top-10 w-52 rotate-[-8deg] md:left-10 md:w-72" />
        <img src={OBJECTS_1} alt="" className="absolute -right-10 bottom-8 w-48 rotate-[8deg] md:right-12 md:w-64" />
        <span className="absolute left-1/2 top-20 h-56 w-56 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[560px] w-full max-w-[1120px] items-start justify-center pt-1 md:items-center md:pt-0">
        <div className="relative w-full max-w-[438px] rounded-[14px] bg-white px-8 py-9 shadow-[0_18px_42px_rgba(63,42,107,0.16)] md:px-10">
          <img src={OBJECTS_1} alt="" className="pointer-events-none absolute -left-10 -top-12 h-24 w-24 object-contain" aria-hidden />
          <img src={OBJECTS} alt="" className="pointer-events-none absolute -bottom-12 -right-14 h-28 w-28 object-contain" aria-hidden />

          <h1 className="crayon mb-3 text-center text-[44px] leading-[0.92] text-[#252020] md:text-[52px]">
            {title}
          </h1>
          {subtitle ? <p className="mx-auto mb-7 max-w-[310px] text-center text-[13px] font-semibold leading-5 text-[#6c5d50]">{subtitle}</p> : <div className="mb-8" />}
          {children}
        </div>
      </div>
    </section>
  );
}
