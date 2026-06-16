import { useEffect, useState } from 'react';
import { Eye, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/endpoints';
import { formatPrice, formatDate } from '@/utils/format';

const STATUSES = [
  { v: '', label: 'Tất cả trạng thái' },
  { v: 'pending', label: 'Chờ xác nhận' },
  { v: 'confirmed', label: 'Đã xác nhận' },
  { v: 'shipping', label: 'Đang giao' },
  { v: 'completed', label: 'Hoàn thành' },
  { v: 'cancelled', label: 'Đã huỷ' },
];

const STATUS_COLOR = {
  pending: 'bg-cream-200 text-cocoa-700',
  confirmed: 'bg-cream-500 text-cocoa-700',
  shipping: 'bg-leaf-500 text-white',
  completed: 'bg-leaf-600 text-white',
  cancelled: 'bg-coral-500 text-white',
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(null);

  const load = () =>
    adminApi.listOrders({ q, status, limit: 50 }).then((d) => setItems(d.items || []));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, status]); // eslint-disable-line

  const updateStatus = async (newStatus) => {
    if (!active) return;
    try {
      const updated = await adminApi.updateOrderStatus(active._id, { status: newStatus });
      toast.success('Đã cập nhật trạng thái');
      setActive(updated);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật không thành công');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-cocoa-700">Đơn hàng</h1>
          <p className="text-sm text-cocoa-400 mt-1">Hiển thị {items.length} đơn</p>
        </div>
        <div className="flex gap-2">
          <div className="card p-2 flex items-center">
            <Search size={16} className="ml-2 text-cocoa-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã, tên, SĐT…"
              className="px-3 py-1.5 outline-none text-sm bg-transparent"
            />
          </div>
          <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-100 text-cocoa-500 text-left">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id} className="border-t border-cream-100">
                  <td className="p-3 font-semibold text-cocoa-600">{o.orderCode}</td>
                  <td className="p-3">
                    <div className="font-semibold text-cocoa-600">{o.customer.fullName}</div>
                    <div className="text-xs text-cocoa-400">{o.customer.phone}</div>
                  </td>
                  <td className="p-3 text-cocoa-500">{formatDate(o.createdAt)}</td>
                  <td className="p-3 font-semibold text-coral-500">{formatPrice(o.total)}</td>
                  <td className="p-3">
                    <span className={`badge ${STATUS_COLOR[o.status]}`}>
                      {STATUSES.find((s) => s.v === o.status)?.label || o.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setActive(o)}
                      className="p-2 rounded-full hover:bg-cream-100"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-cocoa-400">
                    Chưa có đơn hàng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-cocoa-700/50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-cocoa-400">Mã đơn</div>
                <div className="font-display text-2xl text-cocoa-700">{active.orderCode}</div>
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-2 rounded-full hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Khách hàng</div>
                <div className="font-semibold text-cocoa-600">{active.customer.fullName}</div>
                <div className="text-cocoa-500">{active.customer.phone}</div>
                {active.customer.email && (
                  <div className="text-cocoa-500">{active.customer.email}</div>
                )}
              </div>
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Địa chỉ giao</div>
                <div className="text-cocoa-600 font-semibold">
                  {[
                    active.shippingAddress.address,
                    active.shippingAddress.ward,
                    active.shippingAddress.district,
                    active.shippingAddress.province,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {active.shippingAddress.note && (
                  <div className="text-cocoa-400 text-xs mt-1">
                    Ghi chú: {active.shippingAddress.note}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {active.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={it.image || '/assets/paw/Cat Food Kit.png'}
                    className="w-12 h-12 rounded-2xl object-cover bg-cream-100"
                    alt=""
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-cocoa-600 line-clamp-1">{it.name}</div>
                    <div className="text-xs text-cocoa-400">
                      {formatPrice(it.price)} × {it.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-cream-200 mt-4 pt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="text-cocoa-400">Tạm tính</div>
              <div className="text-right">{formatPrice(active.subtotal)}</div>
              <div className="text-cocoa-400">Phí ship</div>
              <div className="text-right">{formatPrice(active.shippingFee)}</div>
              <div className="text-cocoa-400">Phí đóng gói</div>
              <div className="text-right">{formatPrice(active.packagingFee || 0)}</div>
              <div className="text-cocoa-500 font-semibold">Tổng cộng</div>
              <div className="text-right text-coral-500 font-display text-xl">
                {formatPrice(active.total)}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs text-cocoa-400 mb-2">Cập nhật trạng thái</div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s.v).map((s) => (
                  <button
                    key={s.v}
                    onClick={() => updateStatus(s.v)}
                    className={`badge cursor-pointer ${
                      active.status === s.v
                        ? STATUS_COLOR[s.v]
                        : 'bg-cream-100 text-cocoa-500 hover:bg-cream-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs text-cocoa-400 mb-2">Lịch sử trạng thái</div>
              <ul className="space-y-1 text-sm">
                {(active.statusHistory || []).map((h, i) => (
                  <li key={i} className="text-cocoa-500">
                    • <strong>{h.status}</strong> – {formatDate(h.at)}
                    {h.note ? ` (${h.note})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
