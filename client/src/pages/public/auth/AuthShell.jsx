export default function AuthShell({ title, children }) {
  return (
    <section className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#ecd8ff] px-4 py-9 md:py-12">
      <span className="paw-deco absolute left-7 top-24 h-44 w-44 opacity-30" aria-hidden />
      <span className="paw-deco absolute bottom-14 right-8 h-40 w-40 opacity-25" aria-hidden />

      <div className="relative mx-auto flex min-h-[560px] w-full max-w-[1120px] items-start justify-center pt-1 md:items-center md:pt-0">
        <div className="relative w-full max-w-[438px] rounded-[12px] bg-white px-8 py-9 shadow-[0_18px_42px_rgba(63,42,107,0.16)] md:px-10">
          <span
            className="absolute -left-7 -top-9 h-16 w-24 -rotate-[35deg] rounded-[4px] bg-[#7f7888] opacity-90"
            aria-hidden
          />
          <span
            className="absolute -bottom-9 right-[-34px] h-16 w-24 -rotate-[35deg] rounded-[4px] bg-[#ffd6cf] opacity-95"
            aria-hidden
          />

          <h1 className="crayon mb-8 text-center text-[46px] leading-[0.9] text-[#252020] md:text-[52px]">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </section>
  );
}
