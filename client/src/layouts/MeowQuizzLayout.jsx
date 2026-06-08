import { Link, Outlet, useLocation } from 'react-router-dom';
import { Check, Search, ShoppingCart, UserRound } from 'lucide-react';

const stepItems = [
  { label: 'Thú cưng của bạn', path: '/meow-quizz', activeOn: ['/meow-quizz', '/meow-quizz/ho-so'] },
  { label: 'Thực đơn', path: '/meow-quizz/ket-qua', activeOn: ['/meow-quizz/ket-qua'] },
  { label: 'Đặt hàng', path: '/thanh-toan', activeOn: ['/thanh-toan'] },
];

function getActiveStep(pathname) {
  const index = stepItems.findIndex((item) => item.activeOn.some((path) => pathname.startsWith(path)));
  return index >= 0 ? index : 0;
}

export default function MeowQuizzLayout() {
  const { pathname } = useLocation();
  const activeStep = getActiveStep(pathname);

  return (
    <div className="min-h-screen bg-[#fffefa] text-[#26222e]">
      <header className="sticky top-0 z-40 h-20 border-b border-[#eeeaf2] bg-white">
        <div className="grid h-full grid-cols-[300px_1fr_220px] items-center px-12 max-lg:grid-cols-[1fr_auto] max-lg:px-5">
          <Link to="/" className="inline-flex items-center" aria-label="PawWorld">
            <img src="/assets/logo/ngang.png" alt="PawWorld" className="h-[42px] w-auto" />
          </Link>

          <nav className="meow-shell-stepper flex items-center justify-center gap-6 max-lg:hidden" aria-label="Meow Quizz progress">
            {stepItems.map((item, index) => {
              const completed = index < activeStep;
              const active = index === activeStep;
              return (
                <div key={item.label} className="grid min-w-[116px] justify-items-center gap-1">
                  <div className="flex items-center gap-4">
                    {index > 0 ? <span className={completed || active ? 'h-px w-16 bg-[#d7c0ff]' : 'h-px w-16 bg-[#e5d8ff]'} /> : null}
                    <span
                      className={
                        completed || active
                          ? 'grid h-8 w-8 place-items-center rounded-full bg-[#ffc62d] text-sm font-bold text-white'
                          : 'grid h-8 w-8 place-items-center rounded-full border-2 border-[#e5e3ea] bg-white text-sm font-extrabold text-[#b9b6bf]'
                      }
                    >
                      {completed || active ? <Check size={16} strokeWidth={3} /> : index + 1}
                    </span>
                  </div>
                  <span className={active || completed ? 'text-sm font-semibold text-[#ffb800]' : 'text-sm font-semibold text-[#b8b4bd]'}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-5 text-[#181616]">
            <Link to="/dang-nhap" aria-label="Tài khoản" className="grid h-8 w-8 place-items-center">
              <UserRound size={22} strokeWidth={2.6} />
            </Link>
            <Link to="/danh-muc" aria-label="Tìm kiếm" className="grid h-8 w-8 place-items-center">
              <Search size={22} strokeWidth={2.6} />
            </Link>
            <Link to="/gio-hang" aria-label="Giỏ hàng" className="grid h-8 w-8 place-items-center">
              <ShoppingCart size={22} strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
