import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';

import { formatPrice } from '@/utils/format';
import { useCartStore } from '@/store/cartStore';

export default function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);

  const onSale = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const discountPct = onSale
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addToCart(product._id, 1);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thêm được sản phẩm');
    }
  };

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group card hover:-translate-y-1 transition-transform duration-300 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image || '/assets/paw/Cat Food Kit.png'}
          alt={product.name}
          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {onSale && <span className="badge-sale absolute top-3 left-3">-{discountPct}%</span>}
        {product.isBestSeller && (
          <span className="badge bg-cream-500 text-cocoa-700 absolute top-3 right-3">Hot</span>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-cocoa-500 text-cream-50 flex items-center justify-center shadow-soft opacity-0 group-hover:opacity-100 transition"
          aria-label="Thêm vào giỏ"
        >
          <ShoppingCart size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {product.brand && (
          <span className="text-[11px] uppercase tracking-wider text-cocoa-300">
            {product.brand}
          </span>
        )}
        <h3 className="font-semibold text-cocoa-600 text-sm leading-snug line-clamp-2 mt-1 min-h-[40px]">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-cream-700 mt-1">
          <Star size={12} fill="#FFB022" stroke="#FFB022" />
          <span>{product.rating?.toFixed?.(1) || product.rating || 5}</span>
          <span className="text-cocoa-200">· đã bán {product.soldCount || 0}</span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-lg text-coral-500">
            {formatPrice(onSale ? product.salePrice : product.price)}
          </span>
          {onSale && (
            <span className="text-xs text-cocoa-300 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
