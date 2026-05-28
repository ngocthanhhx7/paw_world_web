import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardList, Users, DollarSign, TrendingUp } from 'lucide-react';

import { adminApi } from '@/api/endpoints';
import { formatPrice, formatNumber } from '@/utils/format';

const STATS_CONFIG = [
  { key: 'orders', label: 'Tổng đơn', icon: ClipboardList, color: 'bg-cream-200 text-cocoa-700' },
  {
    key: 'completedOrders',
    label: 'Đơn hoàn thành',
    icon: TrendingUp,
    color: 'bg-leaf-500 text-white',
  },
  {
    key: 'pendingLeads',
    label: 'Khách chờ liên hệ',
    icon: Users,
    color: 'bg-coral-500 text-white',
  },
  { key: 'products', label: 'Sản phẩm', icon: Package, color: 'bg-cocoa-500 text-cream-50' },
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
          <p className="text-sm text-cocoa-400 mt-1">Số liệu thời gian thực của Paw World</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="card p-5">
            <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div className="mt-3 text-cocoa-400 text-xs uppercase tracking-wider">{label}</div>
            <div className="font-display text-3xl text-cocoa-700">
              {formatNumber(data.totals[key])}
            </div>
          </div>
        ))}

        <div className="card p-5 lg:col-span-4 grid lg:grid-cols-[auto_1fr] items-center gap-6">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-cream-500 text-cocoa-700 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div className="mt-3 text-cocoa-400 text-xs uppercase tracking-wider">
              Doanh thu tháng này
            </div>
            <div className="font-display text-3xl text-coral-500">
              {formatPrice(data.totals.revenueThisMonth)}
            </div>
          </div>

          {/* Mini bar chart 7 ngày */}
          <div>
            <div className="text-xs text-cocoa-400 mb-2">Đơn hàng 7 ngày gần nhất</div>
            <div className="flex items-end gap-2 h-32">
              {(data.chart || []).map((d) => (
                <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-cream-500 rounded-t-xl transition-all"
                    style={{
                      height: `${Math.max(6, (d.revenue / maxRev) * 100)}%`,
                    }}
                    title={`${d._id}: ${formatPrice(d.revenue)} • ${d.orders} đơn`}
                  />
                  <div className="text-[10px] text-cocoa-400">{d._id.slice(5)}</div>
                </div>
              ))}
              {(!data.chart || data.chart.length === 0) && (
                <div className="text-cocoa-300 text-sm">Chưa có dữ liệu đơn hàng.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-cocoa-700">Top sản phẩm</h2>
          <Link
            to="/admin/products"
            className="text-sm text-cream-700 font-semibold hover:underline"
          >
            Quản lý sản phẩm →
          </Link>
        </div>
        <div className="mt-4 divide-y divide-cream-100">
          {(data.topProducts || []).map((p) => (
            <div key={p._id} className="flex items-center gap-3 py-3">
              <img
                src={p.image || '/assets/paw/Cat Food Kit.png'}
                alt=""
                className="w-12 h-12 rounded-2xl object-cover bg-cream-100"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-cocoa-600 line-clamp-1">{p.name}</div>
                <div className="text-xs text-cocoa-400">
                  Đã bán {p.soldCount} · Lượt xem {p.viewCount}
                </div>
              </div>
              <div className="text-coral-500 font-display">
                {formatPrice(p.salePrice || p.price)}
              </div>
            </div>
          ))}
          {(!data.topProducts || data.topProducts.length === 0) && (
            <div className="text-sm text-cocoa-400 py-3">Chưa có dữ liệu.</div>
          )}
        </div>
      </div>
    </div>
  );
}
