import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { useCartStore } from '@/store/cartStore';
import { orderApi } from '@/api/endpoints';
import { formatPrice } from '@/utils/format';

const PAYMENT_METHODS = [
  { v: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi shipper giao đến' },
  { v: 'bank_transfer', label: 'Chuyển khoản ngân hàng', desc: 'Thanh toán online qua mã QR payOS' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetch);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    ward: '',
    district: '',
    province: '',
    note: '',
    paymentMethod: 'cod',
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shippingFee = 0;
  const packagingFee = 5000;
  const total = subtotal + packagingFee;

  if (!items.length) {
    return (
      <div className="container-paw py-20 text-center">
        <h1 className="text-3xl text-cocoa-700">Giỏ hàng đang trống</h1>
        <Link to="/danh-muc" className="btn-primary mt-4 inline-flex">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address) {
      return toast.error('Vui lòng điền đầy đủ thông tin nhận hàng');
    }
    setSubmitting(true);
    try {
      const order = await orderApi.create({
        customer: { fullName: form.fullName, phone: form.phone, email: form.email },
        shippingAddress: {
          address: form.address,
          ward: form.ward,
          district: form.district,
          province: form.province,
          note: form.note,
        },
        paymentMethod: form.paymentMethod,
      });
      await fetchCart(); // refresh – server đã clear cart
      if (form.paymentMethod === 'bank_transfer' && order.payment?.checkoutUrl) {
        window.location.assign(order.payment.checkoutUrl);
        return;
      }
      toast.success('Đặt hàng thành công!');
      navigate(`/dat-hang-thanh-cong/${order.orderCode}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-paw py-10">
      <Link to="/gio-hang" className="inline-flex items-center text-sm text-cocoa-400 hover:text-cream-700">
        <ChevronLeft size={16} /> Quay lại giỏ hàng
      </Link>
      <h1 className="text-3xl md:text-4xl text-cocoa-700 mt-2">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8 mt-8">
        {/* Info */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-xl text-cocoa-700">1. Thông tin liên hệ</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <input
                className="input"
                placeholder="Họ và tên *"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <input
                className="input"
                placeholder="Số điện thoại *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className="input md:col-span-2"
                placeholder="Email (không bắt buộc)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl text-cocoa-700">2. Địa chỉ giao hàng</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <input
                className="input md:col-span-2"
                placeholder="Số nhà, tên đường *"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                className="input"
                placeholder="Phường/Xã"
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
              />
              <input
                className="input"
                placeholder="Quận/Huyện"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
              <input
                className="input md:col-span-2"
                placeholder="Tỉnh/Thành phố"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
              <textarea
                className="input md:col-span-2"
                placeholder="Ghi chú cho shipper (tuỳ chọn)"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl text-cocoa-700">3. Hình thức thanh toán</h2>
            <div className="space-y-3 mt-4">
              {PAYMENT_METHODS.map((p) => (
                <label
                  key={p.v}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                    form.paymentMethod === p.v
                      ? 'border-cream-500 bg-cream-100'
                      : 'border-cream-200 hover:bg-cream-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={p.v}
                    checked={form.paymentMethod === p.v}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="mt-1 accent-cream-500"
                  />
                  <div>
                    <div className="font-semibold text-cocoa-600">{p.label}</div>
                    <div className="text-xs text-cocoa-400 mt-0.5">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="card p-6 h-fit lg:sticky lg:top-32">
          <h3 className="font-display text-xl text-cocoa-700">Đơn hàng của bạn</h3>
          <div className="space-y-3 mt-4 max-h-72 overflow-auto pr-1">
            {items.map((it) => (
              <div key={it.product} className="flex gap-3 items-center">
                <div className="relative">
                  <img
                    src={it.image || '/assets/paw/Cat Food Kit.png'}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover bg-cream-100"
                  />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-cocoa-500 text-white text-[11px] rounded-full inline-flex items-center justify-center">
                    {it.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cocoa-600 line-clamp-2">{it.name}</div>
                  <div className="text-xs text-cocoa-400">
                    {formatPrice(it.price)} × {it.quantity}
                  </div>
                </div>
                <div className="text-sm font-semibold text-cocoa-600">
                  {formatPrice(it.price * it.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-cream-200 pt-4 mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa-400">Tạm tính</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cocoa-400">Phí giao hàng</span>
              <span className="font-semibold">
                {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cocoa-400">Phí đóng gói</span>
              <span className="font-semibold">{formatPrice(packagingFee)}</span>
            </div>
            <div className="border-t border-cream-200 pt-2 mt-2 flex justify-between text-base">
              <span className="text-cocoa-500">Tổng cộng</span>
              <span className="font-display text-2xl text-coral-500">{formatPrice(total)}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-5">
            {submitting ? 'Đang đặt hàng…' : 'Xác nhận đặt hàng'}
          </button>

          <div className="mt-3 flex items-center gap-2 text-xs text-cocoa-400">
            <ShieldCheck size={14} className="text-leaf-500" /> Thông tin của bạn được bảo mật
          </div>
        </aside>
      </form>
    </div>
  );
}
