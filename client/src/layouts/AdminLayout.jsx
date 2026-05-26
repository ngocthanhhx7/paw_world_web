import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ClipboardList, Users, LogOut } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { cx } from '@/utils/format';

const NAV = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/categories', label: 'Danh mục', icon: Tag },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/leads', label: 'Khách cần liên hệ', icon: Users },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-cream-50 grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-cocoa-500 text-cream-100 lg:min-h-screen lg:sticky lg:top-0 p-5 flex flex-col">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/logo/ngang.png" alt="Paw World" className="h-12 brightness-0 invert" />
        </Link>
        <span className="text-xs uppercase tracking-widest text-cream-100/60 mt-6 mb-2">Quản trị</span>

        <nav className="space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition',
                  isActive
                    ? 'bg-cream-500 text-cocoa-700'
                    : 'text-cream-100/80 hover:bg-cocoa-600',
                )
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-cream-100/10 pt-4 mt-4">
          <div className="text-xs text-cream-100/60">Đăng nhập với</div>
          <div className="font-semibold text-cream-50">{admin?.name}</div>
          <div className="text-xs text-cream-100/60">{admin?.email}</div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm bg-cream-100/10 hover:bg-cream-100/20"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
