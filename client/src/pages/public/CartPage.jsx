import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

export default function CartPage() {
  const cart = useCartStore((s) => s.cart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const items = cart?.items || [];
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shippingFee = 0;
  const total = subtotal;

  if (!items.length) {
    return (
      <div className="container-paw py-20 text-center">
        <img src="/assets/cat/image 168.png" alt="" className="w-40 mx-auto" />
        <h1 className="text-3xl mt-4 text-cocoa-700">Giỏ hàng đang trống</h1>
        <p className="text-cocoa-400 mt-2">Thêm vài món ngon để boss ăn nào!</p>
        <Link to="/danh-muc" className="btn-primary mt-6 inline-flex">
          <ShoppingBag size={16} /> Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-paw py-10">
      <h1 className="text-3xl md:text-4xl text-cocoa-700">Giỏ hàng của bạn</h1>
      <p className="text-cocoa-400 mt-1">Có {items.length} sản phẩm trong giỏ</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
        {/* Items */}
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.product} className="card p-4 flex gap-4 items-center">
              <img
                src={it.image || '/assets/paw/Cat Food Kit.png'}
                alt={it.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-cream-100"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-cocoa-600 line-clamp-2">{it.name}</div>
                <div className="text-coral-500 font-display text-lg mt-1">
                  {formatPrice(it.price)}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex items-center bg-cream-100 rounded-full">
                  <button
                    className="w-8 h-8 rounded-full hover:bg-cream-200 flex items-center justify-center"
                    onClick={() => updateQuantity(it.product, it.quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{it.quantity}</span>
                  <button
                    className="w-8 h-8 rounded-full hover:bg-cream-200 flex items-center justify-center"
                    onClick={() => updateQuantity(it.product, it.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(it.product)}
                  className="text-xs text-cocoa-300 hover:text-coral-500 inline-flex items-center gap-1"
                >
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            </div>
          ))}

          <Link to="/danh-muc" className="inline-flex items-center gap-2 text-cocoa-500 hover:text-cream-700 mt-2">
            <ArrowLeft size={16} /> Tiếp tục mua sắm
          </Link>
        </div>

        {/* Summary */}
        <aside className="card p-6 h-fit lg:sticky lg:top-32">
          <h3 className="font-display text-xl text-cocoa-700">Tóm tắt đơn hàng</h3>
          <div className="space-y-2 mt-4 text-sm">
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
            <div className="border-t border-cream-200 pt-3 mt-3 flex justify-between text-base">
              <span className="text-cocoa-500">Tổng cộng</span>
              <span className="font-display text-2xl text-coral-500">{formatPrice(total)}</span>
            </div>
          </div>
          <Link to="/thanh-toan" className="btn-primary w-full mt-5">
            Tiến hành đặt hàng
          </Link>
          <p className="text-xs text-cocoa-300 mt-3 text-center">
            Bạn sẽ điền thông tin nhận hàng ở bước tiếp theo. Không cần đăng ký tài khoản.
          </p>
        </aside>
      </div>
    </div>
  );
}
