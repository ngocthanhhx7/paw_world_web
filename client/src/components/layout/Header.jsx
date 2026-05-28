import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import { cx } from '@/utils/format';

const NAV_ITEMS = [
  { to: '/', label: 'MEOW QUIZZ' },
  { to: '/gioi-thieu', label: 'VỀ CHÚNG TÔI' },
  { to: '/danh-muc', label: 'SHOP MEAL KIT' },
  { to: '/lien-he-tu-van', label: 'LIÊN HỆ' },
];

export default function Header() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const totalQty = (cart?.items || []).reduce((s, it) => s + it.quantity, 0);

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/danh-muc?q=${encodeURIComponent(q)}` : '/danh-muc');
    setSearchOpen(false);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-lavender-100">
      <div className="container-paw flex items-center justify-between gap-3 py-4 md:gap-6">
        {/* Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/assets/logo/ngang.png"
            alt="PawWorld"
            className="h-8 w-auto max-w-[168px] md:h-10 md:max-w-none"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'text-[13px] font-bold tracking-[0.08em] text-cocoa-500 hover:text-sun-500 transition-colors',
                  isActive && 'text-sun-500',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 md:gap-2">
          {searchOpen ? (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center bg-lavender-50 rounded-full px-3 py-1.5"
            >
              <Search size={16} className="text-cocoa-300" />
              <input
                autoFocus
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onBlur={() => !keyword && setSearchOpen(false)}
                placeholder="Tìm meal kit…"
                className="w-44 bg-transparent px-2 py-1 outline-none text-sm"
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

          <Link
            to="/gio-hang"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag size={20} />
            {totalQty > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-sun-400 text-cocoa-700 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center">
                {totalQty}
              </span>
            )}
          </Link>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-500 hover:bg-lavender-50 md:h-10 md:w-10 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-lavender-100 bg-white">
          <div className="container-paw py-4 space-y-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-lavender-50 rounded-full px-4 py-2"
            >
              <Search size={18} className="text-cocoa-300" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm sản phẩm…"
                className="flex-1 bg-transparent px-3 outline-none text-sm"
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
                      'rounded-2xl px-4 py-3 text-xs font-bold tracking-[0.08em] border',
                      isActive
                        ? 'bg-sun-400 text-cocoa-700 border-sun-400'
                        : 'bg-white text-cocoa-500 border-lavender-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <Link
              to="/admin/login"
              className="block text-center text-xs text-cocoa-300 underline pt-2"
            >
              Trang quản trị
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
