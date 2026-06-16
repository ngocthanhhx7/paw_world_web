import { Fragment } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Check, Search, ShoppingCart, UserRound } from 'lucide-react';

import { useCustomerAuthStore } from '@/store/customerAuthStore';

const stepItems = [
  { label: 'Thú cưng của bạn', path: '/meow-quizz', activeOn: ['/meow-quizz', '/meow-quizz/ho-so'] },
  { label: 'Thực đơn', path: '/meow-quizz/ket-qua', activeOn: ['/meow-quizz/ket-qua'] },
  { label: 'Đặt hàng', path: '/thanh-toan', activeOn: ['/thanh-toan'] },
];

function getActiveStep(pathname) {
  const index = stepItems.findIndex((item) => item.activeOn.some((path) => pathname.startsWith(path)));
  return index >= 0 ? index : 0;
}

function StepCircle({ index, activeStep, compact = false }) {
  const completed = index < activeStep;
  const active = index === activeStep;
  const isHighlighted = completed || active;

  return (
    <span
      className={
        isHighlighted
          ? `${compact ? 'h-8 w-8' : 'h-9 w-9'} grid place-items-center rounded-full bg-[#ffc62d] text-sm font-bold text-white`
          : `${compact ? 'h-8 w-8' : 'h-9 w-9'} grid place-items-center rounded-full border-2 border-[#e5e3ea] bg-white text-sm font-extrabold text-[#b9b6bf]`
      }
    >
      {isHighlighted ? <Check size={compact ? 15 : 16} strokeWidth={3} /> : index + 1}
    </span>
  );
}

function StepLabel({ item, index, activeStep, compact = false }) {
  const completed = index < activeStep;
  const active = index === activeStep;

  return (
    <span
      className={
        completed || active
          ? `${compact ? 'max-w-[74px] text-[12px] whitespace-normal' : 'text-sm whitespace-nowrap'} text-center font-semibold leading-tight text-[#ffb800]`
          : `${compact ? 'max-w-[74px] text-[12px] whitespace-normal' : 'text-sm whitespace-nowrap'} text-center font-semibold leading-tight text-[#b8b4bd]`
      }
    >
      {item.label}
    </span>
  );
}

function StepLine({ highlighted = false, compact = false }) {
  return <span className={`${compact ? 'mt-4' : 'mt-[18px]'} h-px w-full ${highlighted ? 'bg-[#d7c0ff]' : 'bg-[#e5d8ff]'}`} />;
}

export default function MeowQuizzLayout() {
  const { pathname } = useLocation();
  const customer = useCustomerAuthStore((s) => s.customer);
  const activeStep = getActiveStep(pathname);
  const isEditingPetProfile = /^\/meow-quizz\/ho-so\/[^/]+\/chinh-sua$/.test(pathname);
  const shouldShowStepper = !isEditingPetProfile;
  const headerGridClassName = isEditingPetProfile
    ? 'grid h-20 grid-cols-[minmax(0,1fr)_auto] items-center px-12 max-lg:px-5 max-sm:h-[68px] max-sm:px-4'
    : 'grid h-20 grid-cols-[300px_1fr_220px] items-center px-12 max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:px-5 max-sm:h-[68px] max-sm:px-4';

  return (
    <div className="min-h-screen bg-[#fffefa] text-[#26222e]">
      <header className={`${isEditingPetProfile ? 'relative z-40' : 'sticky top-0 z-40'} border-b border-[#eeeaf2] bg-white`}>
        <div className={headerGridClassName}>
          <Link to="/" className="inline-flex min-w-0 items-center" aria-label="PawWorld">
            <img src="/assets/logo/ngang.png" alt="PawWorld" className="h-[42px] w-auto max-w-full max-sm:h-9" />
          </Link>

          {shouldShowStepper ? (
            <nav
              className="meow-shell-stepper hidden grid-cols-[120px_64px_120px_64px_120px] items-start justify-center lg:grid xl:grid-cols-[132px_72px_132px_72px_132px]"
              aria-label="Meow Quizz progress"
            >
              {stepItems.map((item, index) => {
                return (
                  <Fragment key={item.label}>
                    {index > 0 ? <StepLine highlighted={index <= activeStep} /> : null}
                    <div className="grid min-w-0 justify-items-center gap-2">
                      <StepCircle index={index} activeStep={activeStep} />
                      <StepLabel item={item} index={index} activeStep={activeStep} />
                    </div>
                  </Fragment>
                );
              })}
            </nav>
          ) : null}

          <div className="flex shrink-0 items-center justify-end gap-5 text-[#181616] max-sm:gap-2">
            <Link to={customer ? '/meow-quizz/ho-so' : '/dang-nhap'} aria-label="Tài khoản" className="grid h-8 w-8 place-items-center">
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
        {shouldShowStepper ? (
          <nav
            className="meow-shell-mobile-stepper grid grid-cols-[minmax(72px,1fr)_minmax(28px,48px)_minmax(56px,0.8fr)_minmax(28px,48px)_minmax(56px,0.8fr)] items-start border-t border-[#f4eff8] px-4 pb-3 pt-3 lg:hidden"
            aria-label="Meow Quizz progress mobile"
          >
            {stepItems.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 ? <StepLine compact highlighted={index <= activeStep} /> : null}
                <div className="grid min-w-0 justify-items-center gap-1.5">
                  <StepCircle compact index={index} activeStep={activeStep} />
                  <StepLabel compact item={item} index={index} activeStep={activeStep} />
                </div>
              </Fragment>
            ))}
          </nav>
        ) : null}
      </header>
      <Outlet />
    </div>
  );
}
