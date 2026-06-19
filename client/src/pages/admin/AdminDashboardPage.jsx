import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, DollarSign, Package, TrendingUp, UserCheck, UserRound, Users, UserX } from 'lucide-react';

import { adminApi } from '@/api/endpoints';
import { formatNumber, formatPrice } from '@/utils/format';

const STATS_CONFIG = [
  { key: 'orders', label: 'Tổng đơn', icon: ClipboardList, color: 'bg-cream-200 text-cocoa-700' },
  { key: 'completedOrders', label: 'Đơn hoàn thành', icon: TrendingUp, color: 'bg-leaf-500 text-white' },
  { key: 'pendingLeads', label: 'Khách chờ liên hệ', icon: Users, color: 'bg-coral-500 text-white' },
  { key: 'products', label: 'Sản phẩm', icon: Package, color: 'bg-cocoa-500 text-cream-50' },
  { key: 'customers', label: 'Khách hàng', icon: UserRound, color: 'bg-cream-500 text-cocoa-700' },
  { key: 'newCustomersThisMonth', label: 'User mới tháng này', icon: UserCheck, color: 'bg-leaf-600 text-white' },
  { key: 'lockedCustomers', label: 'User bị khóa', icon: UserX, color: 'bg-coral-500 text-white' },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.overview().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-cocoa-400">Đang tải dữ liệu…</div>;

  const maxRev = Math.max(1, ...(data.chart || []).map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl text-cocoa-700">Tổng quan</h1>
          <p className="mt-1 text-sm text-cocoa-400">Số liệu thời gian thực của Paw World</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="card p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
              <Icon size={20} />
            </div>
            <div className="mt-3 text-xs uppercase tracking-wider text-cocoa-400">{label}</div>
            <div className="font-display text-3xl text-cocoa-700">
              {formatNumber(data.totals[key])}
            </div>
          </div>
        ))}

        <div className="card grid items-center gap-6 p-5 lg:col-span-4 lg:grid-cols-[auto_1fr]">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-500 text-cocoa-700">
              <DollarSign size={20} />
            </div>
            <div className="mt-3 text-xs uppercase tracking-wider text-cocoa-400">
              Doanh thu tháng này
            </div>
            <div className="font-display text-3xl text-coral-500">
              {formatPrice(data.totals.revenueThisMonth)}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-cocoa-400">Đơn hàng 7 ngày gần nhất</div>
            <div className="flex h-32 items-end gap-2">
              {(data.chart || []).map((d) => (
                <div key={d._id} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-xl bg-cream-500 transition-all"
                    style={{
                      height: `${Math.max(6, (d.revenue / maxRev) * 100)}%`,
                    }}
                    title={`${d._id}: ${formatPrice(d.revenue)} • ${d.orders} đơn`}
                  />
                  <div className="text-[10px] text-cocoa-400">{d._id.slice(5)}</div>
                </div>
              ))}
              {(!data.chart || data.chart.length === 0) && (
                <div className="text-sm text-cocoa-300">Chưa có dữ liệu đơn hàng.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-cocoa-700">Top sản phẩm</h2>
            <Link to="/admin/products" className="text-sm font-semibold text-cream-700 hover:underline">
              Quản lý sản phẩm →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-cream-100">
            {(data.topProducts || []).map((p) => (
              <div key={p._id} className="flex items-center gap-3 py-3">
                <img
                  src={p.image || '/assets/paw/Cat Food Kit.png'}
                  alt=""
                  className="h-12 w-12 rounded-2xl bg-cream-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-semibold text-cocoa-600">{p.name}</div>
                  <div className="text-xs text-cocoa-400">
                    Đã bán {p.soldCount} · Lượt xem {p.viewCount}
                  </div>
                </div>
                <div className="font-display text-coral-500">
                  {formatPrice(p.salePrice || p.price)}
                </div>
              </div>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <div className="py-3 text-sm text-cocoa-400">Chưa có dữ liệu.</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-cocoa-700">Top khách hàng</h2>
            <Link to="/admin/users" className="text-sm font-semibold text-cream-700 hover:underline">
              Quản lý khách hàng →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-cream-100">
            {(data.topCustomers || []).map((customer) => (
              <div key={customer.email} className="flex items-center gap-3 py-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-cream-100 text-sm font-bold text-cocoa-500">
                  {customer.avatar ? <img src={customer.avatar} alt="" className="h-full w-full object-cover" /> : customer.fullName?.[0] || 'K'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-semibold text-cocoa-600">{customer.fullName}</div>
                  <div className="text-xs text-cocoa-400">
                    {customer.orderCount} đơn · {customer.email}
                  </div>
                </div>
                <div className="font-display text-coral-500">
                  {formatPrice(customer.totalSpent)}
                </div>
              </div>
            ))}
            {(!data.topCustomers || data.topCustomers.length === 0) && (
              <div className="py-3 text-sm text-cocoa-400">Chưa có dữ liệu khách hàng.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
