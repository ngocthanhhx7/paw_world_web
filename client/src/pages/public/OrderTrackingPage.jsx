import { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { orderApi } from '@/api/endpoints';
import { formatPrice, formatDate } from '@/utils/format';

const STATUS_LABEL = {
  pending: { label: 'Chờ xác nhận', color: 'bg-cream-200 text-cocoa-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-cream-500 text-cocoa-700' },
  shipping: { label: 'Đang giao', color: 'bg-leaf-500 text-white' },
  completed: { label: 'Hoàn thành', color: 'bg-leaf-600 text-white' },
  cancelled: { label: 'Đã huỷ', color: 'bg-coral-500 text-white' },
};

export default function OrderTrackingPage() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setOrder(null);
    try {
      const data = await orderApi.getByCode(code.trim());
      setOrder(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-paw py-12">
      <div className="max-w-2xl mx-auto text-center">
        <Package size={48} className="mx-auto text-cream-700" />
        <h1 className="text-3xl md:text-4xl mt-3 text-cocoa-700">Tra cứu đơn hàng</h1>
        <p className="text-cocoa-400 mt-2">Nhập mã đơn (ví dụ: PW202612250001)</p>

        <form onSubmit={handleSearch} className="card p-2 flex items-center mt-6 max-w-lg mx-auto">
          <Search size={18} className="text-cocoa-300 ml-3" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Nhập mã đơn hàng"
            className="flex-1 px-3 py-2 outline-none bg-transparent"
          />
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Đang tra…' : 'Tra cứu'}
          </button>
        </form>
      </div>

      {order && (
        <div className="card max-w-3xl mx-auto p-6 md:p-8 mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-cocoa-400">Mã đơn hàng</div>
              <div className="font-display text-2xl text-cocoa-700">{order.orderCode}</div>
              <div className="text-xs text-cocoa-400 mt-1">{formatDate(order.createdAt)}</div>
            </div>
            <span
              className={`badge ${STATUS_LABEL[order.status].color} text-sm py-1.5 px-4`}
            >
              {STATUS_LABEL[order.status].label}
            </span>
          </div>

          <div className="border-t border-cream-200 mt-4 pt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-cocoa-400">Người nhận</div>
              <div className="font-semibold text-cocoa-600">
                {order.customer.fullName} - {order.customer.phone}
              </div>
            </div>
            <div>
              <div className="text-cocoa-400">Địa chỉ</div>
              <div className="font-semibold text-cocoa-600">
                {[
                  order.shippingAddress.address,
                  order.shippingAddress.ward,
                  order.shippingAddress.district,
                  order.shippingAddress.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={it.image || '/assets/paw/Cat Food Kit.png'}
                  className="w-12 h-12 rounded-xl object-cover bg-cream-100"
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

          <div className="border-t border-cream-200 mt-4 pt-4 flex justify-between text-base">
            <span className="text-cocoa-500">Tổng tiền</span>
            <span className="font-display text-2xl text-coral-500">{formatPrice(order.total)}</span>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to="/danh-muc" className="btn-outline">
              Tiếp tục mua sắm
            </Link>
            <a href="tel:0772211666" className="btn-primary">
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
