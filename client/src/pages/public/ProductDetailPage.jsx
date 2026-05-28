import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Fish,
  Target,
  ShoppingCart,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { productApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

/* --------------------------- Static helpers --------------------------- */

const DAY_PANELS = [
  {
    day: 'NGÀY 1 – LÀM QUEN & KÍCH THÍCH VỊ GIÁC',
    bg: 'bg-sun-200',
    items: ['1 pouch pate', '1 gói súp', '50g hạt khô'],
  },
  {
    day: 'NGÀY 2 – DUY TRÌ NĂNG LƯỢNG & TIÊU HÓA ỔN ĐỊNH',
    bg: 'bg-lavender-200',
    items: ['1 pouch pate', '1 gói súp', '50g hạt khô'],
  },
  {
    day: 'NGÀY 3 – HỖ TRỢ ĐẸP LÔNG & GIỮ DÁNG',
    bg: 'bg-mint-200',
    items: ['1 pouch pate', '1 gói súp', '50g hạt khô'],
  },
];

const RELATED_CARD_CFG = [
  { badge: 'BÁN CHẠY NHẤT', badgeColor: 'bg-blush-400' },
  { badge: null, badgeColor: '' },
  { badge: null, badgeColor: '' },
];

/* ----------------------------- Sub component ----------------------------- */

function MealKitCard({ product, badge, badgeColor }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const onSale =
    product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const price = onSale ? product.salePrice : product.price;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product._id, 1);
      toast.success('Đã thêm vào giỏ');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thêm được');
    }
  };

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group block rounded-3xl bg-white shadow-card overflow-hidden hover:-translate-y-1 transition-transform duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        {badge && (
          <span
            className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider text-white ${badgeColor}`}
          >
            {badge}
          </span>
        )}
        <img
          src={product.image || '/assets/paw/Cat Food Kit.png'}
          alt={product.name}
          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-cocoa-500 leading-snug line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-cocoa-400 mt-1 line-clamp-2 min-h-[2rem]">
          {product.shortDescription || product.description?.slice(0, 80) || ''}
        </p>
        <div className="border-t border-dashed border-cocoa-200/60 my-3" />
        <div className="flex items-center justify-between">
          <span className="font-display text-xl text-cocoa-500">{formatPrice(price)}</span>
          <button
            onClick={handleAdd}
            className="w-9 h-9 rounded-full bg-sun-400 hover:bg-sun-500 text-cocoa-700 flex items-center justify-center shadow-sm"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------- Page --------------------------------- */

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!slug) return;
    productApi.get(slug).then((d) => {
      setProduct(d.product);
      setRelated(d.related || []);
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  if (!product) {
    return <div className="container-paw py-20 text-center">Đang tải sản phẩm…</div>;
  }

  const onSale = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const finalPrice = onSale ? product.salePrice : product.price;
  const discountPct = onSale
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const handleAdd = async () => {
    try {
      await addToCart(product._id, 1);
      toast.success('Đã thêm vào giỏ');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thêm được');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product._id, 1);
      navigate('/thanh-toan');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không xử lý được');
    }
  };

  // Subtitle bên dưới tên sản phẩm: dùng shortDescription hoặc fallback combo
  const subtitle =
    product.shortDescription || `(${product.weight || '3 ngày'} • Mix Pate • Súp • Hạt khô)`;

  // Mục tiêu: lấy từ tags hoặc fallback
  const goalText =
    (product.tags || [])
      .filter((t) => t && !t.toLowerCase().includes('sample'))
      .slice(0, 3)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(', ') || 'Hỗ trợ tiêu hóa, Đẹp lông, Đủ nước';

  return (
    <div className="bg-cream-50">
      {/* Breadcrumb */}
      <div className="container-paw pt-8">
        <nav className="text-xs text-cocoa-400 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-cocoa-500">
            Trang chủ
          </Link>
          <span className="mx-1">›</span>
          <Link to="/danh-muc" className="hover:text-cocoa-500">
            Shop Meal Kit
          </Link>
          <span className="mx-1">›</span>
          <span className="text-cocoa-500 font-semibold">Chi tiết Kit</span>
        </nav>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-sun-500 hover:bg-sun-200 transition"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl md:text-3xl text-sun-500">Chi tiết Kit</h1>
        </div>
      </div>

      {/* Hero product */}
      <section className="container-paw mt-6">
        <div className="rounded-[36px] bg-cream-100 p-6 md:p-10 lg:p-12 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <div className="relative">
            {product.isBestSeller && (
              <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 z-10 w-24 h-24 md:w-28 md:h-28 rounded-full bg-peach-400 text-white font-display text-base md:text-lg flex items-center justify-center text-center leading-tight rotate-[-12deg] shadow-soft">
                BEST
                <br />
                SELLER
              </div>
            )}
            <div className="aspect-square rounded-3xl overflow-hidden bg-white flex items-center justify-center p-4">
              <img
                src={product.image || '/assets/paw/Cat Food Kit.png'}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-3xl md:text-5xl text-cocoa-500 leading-tight">
              {product.name}
            </h2>
            <p className="text-sm text-cocoa-400 mt-3">{subtitle}</p>

            <div className="flex items-baseline gap-3 flex-wrap mt-6">
              <span className="font-display text-5xl md:text-6xl text-coral-500">
                {formatPrice(finalPrice)}
              </span>
              {onSale && (
                <span className="text-cocoa-300 line-through text-base">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {onSale && (
              <p className="text-sm text-cocoa-400 italic mt-1">
                Tiết kiệm hơn {discountPct}% so với mua lẻ
              </p>
            )}

            <ul className="mt-6 space-y-3 text-sm text-cocoa-500">
              <li className="flex items-center gap-3">
                <Clock size={18} className="text-cocoa-500 shrink-0" />
                <span>
                  <strong>Thời gian:</strong> {product.weight || '3 ngày'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Fish size={18} className="text-cocoa-500 shrink-0" />
                <span>
                  <strong>Thành phần:</strong> {product.flavor || 'Mix Pate, Súp & Hạt'}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Target size={18} className="text-cocoa-500 shrink-0" />
                <span>
                  <strong>Mục tiêu:</strong> {goalText}
                </span>
              </li>
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleAdd}
                className="btn bg-sun-200 text-cocoa-500 hover:bg-sun-300 px-7 py-3"
              >
                Thêm vào giỏ hàng
              </button>
              <button onClick={handleBuyNow} className="btn-primary px-8 py-3">
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Thông tin chi tiết */}
      <section className="container-paw py-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Left column: heading + 3 NGÀY */}
          <div>
            <h3 className="font-display text-3xl md:text-4xl text-cocoa-500 leading-tight">
              Thông tin
              <br />
              chi tiết
            </h3>
            <div className="mt-10 lg:mt-16 hidden lg:block text-center">
              <div className="font-display text-[160px] text-sun-500 leading-none">3</div>
              <div className="font-display text-3xl text-sun-500 mt-2 tracking-wider">NGÀY</div>
            </div>
          </div>

          {/* Right column: description + day panels */}
          <div>
            <p className="text-cocoa-500 text-sm flex items-start gap-2">
              <Star
                size={16}
                fill="#FFB022"
                stroke="#FFB022"
                className="mt-0.5 shrink-0"
              />
              <strong>Meal Kit bán chạy dành cho mèo trưởng thành</strong>
            </p>
            <p className="text-cocoa-500/80 text-sm leading-relaxed mt-3 mb-6 max-w-3xl">
              {product.description ||
                'Một combo dinh dưỡng cân bằng giúp boss ăn ngon hơn, bổ sung nước tốt hơn và duy trì thể trạng ổn định mỗi ngày. Phù hợp cho mèo kén ăn, ít uống nước hoặc mới chuyển sang chế độ ăn mix ướt & khô.'}
            </p>

            {/* Mobile-only big "3 NGÀY" */}
            <div className="lg:hidden mb-6 flex items-baseline gap-3">
              <span className="font-display text-7xl text-sun-500 leading-none">3</span>
              <span className="font-display text-2xl text-sun-500 tracking-wider">NGÀY</span>
            </div>

            <div className="space-y-4">
              {DAY_PANELS.map((p) => (
                <div key={p.day} className={`${p.bg} rounded-2xl px-5 py-4 shadow-card/50`}>
                  <div className="font-bold text-cocoa-500 text-sm tracking-wide">{p.day}</div>
                  <ul className="mt-2 space-y-1 text-sm text-cocoa-500">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-paw pb-20">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h3 className="font-display text-3xl md:text-4xl text-cocoa-500">Meal Kit khác</h3>
              <p className="text-cocoa-400 text-sm mt-2">
                Chọn theo nhu cầu đặc biệt của bé yêu.
              </p>
            </div>
            <Link
              to="/danh-muc"
              className="text-sm font-bold text-cocoa-500 underline hover:text-sun-500"
            >
              Xem tất cả combo
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {related.slice(0, 3).map((p, i) => (
              <MealKitCard
                key={p._id}
                product={p}
                badge={RELATED_CARD_CFG[i % 3].badge}
                badgeColor={RELATED_CARD_CFG[i % 3].badgeColor}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
