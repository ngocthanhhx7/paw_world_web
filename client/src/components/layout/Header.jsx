import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import { cx } from '@/utils/format';

const NAV_ITEMS = [
  { to: '/meow-quizz', label: 'MEOW QUIZZ' },
  { to: '/gioi-thieu', label: 'VỀ CHÚNG TÔI' },
  { to: '/danh-muc', label: 'SHOP MEAL KIT' },
  { to: '/lien-he-tu-van', label: 'LIÊN HỆ' },
];

export default function Header() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const customer = useCustomerAuthStore((s) => s.customer);
  const logoutCustomer = useCustomerAuthStore((s) => s.logout);
  const totalQty = (cart?.items || []).reduce((s, it) => s + it.quantity, 0);

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/danh-muc?q=${encodeURIComponent(q)}` : '/danh-muc');
    setSearchOpen(false);
    setOpen(false);
  };

  const handleAccountClick = async () => {
    if (!customer) {
      navigate('/dang-nhap');
      return;
    }
    setAccountOpen((value) => !value);
  };

  const handleLogout = async () => {
    await logoutCustomer();
    setAccountOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-lavender-100 bg-white">
      <div className="container-paw flex items-center justify-between gap-3 py-4 md:gap-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/assets/logo/ngang.png"
            alt="PawWorld"
            className="h-8 w-auto max-w-[168px] md:h-10 md:max-w-none"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'text-[13px] font-bold tracking-[0.08em] text-cocoa-500 transition-colors hover:text-sun-500',
                  isActive && 'text-sun-500',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 md:gap-2">
          {searchOpen ? (
            <form
              onSubmit={handleSearch}
              className="hidden items-center rounded-full bg-lavender-50 px-3 py-1.5 md:flex"
            >
              <Search size={16} className="text-cocoa-300" />
              <input
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onBlur={() => !keyword && setSearchOpen(false)}
                placeholder="Tìm meal kit…"
                className="w-44 bg-transparent px-2 py-1 text-sm outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10"
              aria-label="Tìm kiếm"
            >
              <Search size={20} />
            </button>
          )}

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={handleAccountClick}
              className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10"
              aria-label="Tài khoản"
            >
              <User size={20} />
            </button>

            {customer && accountOpen ? (
              <div className="absolute right-0 top-12 z-50 w-60 rounded-[14px] border border-lavender-100 bg-white p-2 shadow-[0_18px_34px_rgba(63,42,107,0.16)]">
                <Link
                  to="/meow-quizz/ho-so"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium text-cocoa-600 hover:bg-lavender-50"
                >
                  Hồ sơ thú cưng
                </Link>
                <Link
                  to="/tra-cuu-don-hang"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium text-cocoa-600 hover:bg-lavender-50"
                >
                  Đơn hàng của tôi
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left text-sm font-medium text-cocoa-600 hover:bg-lavender-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>

          <Link
            to="/gio-hang"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag size={20} />
            {totalQty > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sun-400 px-1 text-[10px] font-bold text-cocoa-700">
                {totalQty}
              </span>
            )}
          </Link>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-lavender-100 bg-white lg:hidden">
          <div className="container-paw space-y-3 py-4">
            <form
              onSubmit={handleSearch}
              className="flex items-center rounded-full bg-lavender-50 px-4 py-2"
            >
              <Search size={18} className="text-cocoa-300" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm sản phẩm…"
                className="flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button type="submit" className="btn-primary !py-1.5 !px-4">
                Tìm
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'rounded-2xl border px-4 py-3 text-xs font-bold tracking-[0.08em]',
                      isActive
                        ? 'border-sun-400 bg-sun-400 text-cocoa-700'
                        : 'border-lavender-100 bg-white text-cocoa-500',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
