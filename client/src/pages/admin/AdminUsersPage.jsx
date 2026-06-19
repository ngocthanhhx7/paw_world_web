import { useEffect, useState } from 'react';
import { Eye, Lock, Search, Unlock, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/endpoints';
import { formatDate, formatNumber, formatPrice } from '@/utils/format';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'locked', label: 'Đã khóa' },
];

const PROVIDER_OPTIONS = [
  { value: '', label: 'Tất cả nguồn đăng nhập' },
  { value: 'password', label: 'Email / mật khẩu' },
  { value: 'google', label: 'Google' },
];

function providerLabel(customer) {
  return customer.googleSub ? 'Google' : 'Email';
}

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [active, setActive] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = () =>
    adminApi.listCustomers({ q, status, provider, limit: 50 }).then((data) => setItems(data.items || []));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [q, status, provider]); // eslint-disable-line

  const openDetail = async (customer) => {
    setLoadingDetail(true);
    try {
      const detail = await adminApi.getCustomer(customer.id);
      setActive(detail);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tải được thông tin khách hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleStatus = async () => {
    if (!active?.customer) return;
    try {
      const updated = await adminApi.updateCustomerStatus(active.customer.id, { isActive: !active.customer.isActive });
      toast.success(updated.customer.isActive ? 'Đã mở khóa khách hàng' : 'Đã khóa khách hàng');
      const detail = await adminApi.getCustomer(active.customer.id);
      setActive(detail);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật trạng thái không thành công');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl text-cocoa-700">Khách hàng</h1>
          <p className="mt-1 text-sm text-cocoa-400">Quản lý {formatNumber(items.length)} tài khoản khách hàng</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="card flex items-center p-2">
            <Search size={16} className="ml-2 text-cocoa-300" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Tìm theo tên, email, SĐT"
              className="bg-transparent px-3 py-1.5 text-sm outline-none"
            />
          </div>
          <select className="input !w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select className="input !w-auto" value={provider} onChange={(event) => setProvider(event.target.value)}>
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-100 text-left text-cocoa-500">
              <tr>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Nguồn</th>
                <th className="p-3">Đăng nhập gần nhất</th>
                <th className="p-3">Đơn hàng</th>
                <th className="p-3">Tổng chi tiêu</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.id} className="border-t border-cream-100">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-cream-100 text-sm font-bold text-cocoa-500">
                        {customer.avatar ? <img src={customer.avatar} alt="" className="h-full w-full object-cover" /> : customer.fullName?.[0] || 'K'}
                      </div>
                      <div>
                        <div className="font-semibold text-cocoa-600">{customer.fullName}</div>
                        <div className="text-xs text-cocoa-400">{customer.email}</div>
                        {customer.phone ? <div className="text-xs text-cocoa-300">{customer.phone}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-cocoa-500">{providerLabel(customer)}</td>
                  <td className="p-3 text-cocoa-500">{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : '—'}</td>
                  <td className="p-3 font-semibold text-cocoa-600">{formatNumber(customer.orderCount)}</td>
                  <td className="p-3 font-semibold text-coral-500">{formatPrice(customer.totalSpent)}</td>
                  <td className="p-3">
                    <span className={`badge ${customer.isActive ? 'bg-leaf-500 text-white' : 'bg-coral-500 text-white'}`}>
                      {customer.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={loadingDetail}
                      onClick={() => openDetail(customer)}
                      className="rounded-full p-2 hover:bg-cream-100 disabled:opacity-50"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-cocoa-400">
                    Chưa có khách hàng phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-700/50 p-4">
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-auto p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-cocoa-400">Khách hàng</div>
                <h2 className="text-2xl text-cocoa-700">{active.customer.fullName}</h2>
                <div className="text-sm text-cocoa-400">{active.customer.email}</div>
              </div>
              <button type="button" onClick={() => setActive(null)} className="rounded-full p-2 hover:bg-cream-100">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Tổng đơn</div>
                <div className="font-display text-2xl text-cocoa-700">{formatNumber(active.summary.orderCount)}</div>
              </div>
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Hoàn thành</div>
                <div className="font-display text-2xl text-leaf-600">{formatNumber(active.summary.completedOrderCount)}</div>
              </div>
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Tổng chi tiêu</div>
                <div className="font-display text-xl text-coral-500">{formatPrice(active.summary.totalSpent)}</div>
              </div>
              <div className="card bg-cream-50 p-4">
                <div className="text-xs text-cocoa-400">Giá trị TB</div>
                <div className="font-display text-xl text-cocoa-700">{formatPrice(active.summary.averageOrderValue)}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
              <div className="rounded-2xl bg-cream-50 p-4 text-sm text-cocoa-500">
                <div>Điện thoại: {active.customer.phone || '—'}</div>
                <div>Nguồn đăng nhập: {providerLabel(active.customer)}</div>
                <div>Ngày tạo: {formatDate(active.customer.createdAt)}</div>
                <div>Đơn gần nhất: {active.summary.latestOrderAt ? formatDate(active.summary.latestOrderAt) : '—'}</div>
              </div>
              <button
                type="button"
                onClick={toggleStatus}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                  active.customer.isActive
                    ? 'bg-coral-500 text-white hover:bg-coral-600'
                    : 'bg-leaf-500 text-white hover:bg-leaf-600'
                }`}
              >
                {active.customer.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                {active.customer.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg text-cocoa-700">Đơn gần đây</h3>
              <div className="mt-3 divide-y divide-cream-100">
                {(active.recentOrders || []).map((order) => (
                  <div key={order.orderCode} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <div className="font-semibold text-cocoa-600">{order.orderCode}</div>
                      <div className="text-xs text-cocoa-400">{formatDate(order.createdAt)}</div>
                    </div>
                    <span className="badge bg-cream-100 text-cocoa-500">{order.status}</span>
                    <div className="font-semibold text-coral-500">{formatPrice(order.total)}</div>
                  </div>
                ))}
                {(!active.recentOrders || active.recentOrders.length === 0) ? (
                  <div className="py-4 text-sm text-cocoa-400">Khách hàng chưa có đơn hàng.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
