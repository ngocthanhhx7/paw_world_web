import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bone, ChevronLeft, ChevronRight, Info, Leaf, ShoppingBag, Waves, Zap } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

const productFallback = '/assets/paw/Cat Food Kit.png';
const durationOptions = [
  { durationDays: 1, label: '1 ngày' },
  { durationDays: 7, label: '7 ngày' },
  { durationDays: 30, label: '30 ngày' },
];

const PRODUCT_ROLE_ORDER = {
  base: 0,
  wet: 1,
  support: 2,
  treat: 3,
};

const PRODUCT_ROLE_PORTIONS = {
  base: { percent: 75, label: 'Hạt khô' },
  wet: { percent: 20, label: 'Pate dinh dưỡng' },
  support: { percent: 5, label: 'Bổ trợ' },
  treat: { percent: 5, label: 'Thanh súp thưởng' },
};

function pickProducts(recommendation) {
  return recommendation?.products || recommendation?.recommendedProducts || [];
}

function getProductId(product) {
  return product?.productId || product?._id || product?.id || '';
}

function isDbProduct(product) {
  const id = getProductId(product);
  return id && !String(id).startsWith('fallback');
}

function getProductQuantity(product) {
  const quantity = Number(product?.quantity || product?.qty || product?.recommendedQuantity || 1);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function quantityDetailText(product) {
  const quantity = getProductQuantity(product);
  if (product?.quantityBasis === 'manual_review') {
    return `Số lượng trong combo: ${quantity} sản phẩm - cần kiểm tra định lượng`;
  }
  const packageLabel = product?.packageLabel ? ` x ${product.packageLabel}` : '';
  const coveredDays = Number(product?.estimatedDaysCovered);
  const coveredText = Number.isFinite(coveredDays) && coveredDays > 0 ? `, ước tính đủ ${coveredDays} ngày` : '';
  return `Số lượng trong combo: ${quantity}${packageLabel}${coveredText}`;
}

function foodTypeLabel(value) {
  const labels = {
    dry: 'thức ăn khô',
    wet: 'pate hoặc súp dinh dưỡng',
    mixed: 'combo cân bằng khô và ướt',
  };
  return labels[value] || value || 'meal kit';
}

function comboSummaryText(summary, catDisplayName, selectedDurationDays) {
  const fallback = `Dựa trên thông tin về ${catDisplayName}, PawWorld đã thiết kế combo dinh dưỡng cân bằng ${selectedDurationDays} ngày giúp bé có khẩu phần phù hợp hơn.`;
  const englishBalanced = ['complete', 'and', 'balanced'].join('-');
  return String(summary || fallback)
    .replace(new RegExp(`mixed ${englishBalanced}`, 'gi'), 'cân bằng khô và ướt')
    .replace(new RegExp(englishBalanced, 'gi'), 'dinh dưỡng cân bằng');
}

function portionPercent(product) {
  const value = Number(product?.portionPercent);
  if (Number.isFinite(value) && value > 0) return Math.min(100, value);
  return PRODUCT_ROLE_PORTIONS[product?.productRole]?.percent || 5;
}

function formatPortionPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, '');
}

function portionLabel(product) {
  return product?.portionLabel || product?.roleLabel || PRODUCT_ROLE_PORTIONS[product?.productRole]?.label || 'Bổ trợ';
}

function caloriesText(value) {
  if (!value) return '198';
  if (typeof value === 'number') return String(value);
  if (value.min && value.max) return String(Math.round((Number(value.min) + Number(value.max)) / 2));
  return String(value);
}

function ingredientBodyText(product) {
  if (product?.reason) return product.reason;
  const roleLabels = {
    base: 'Sản phẩm chính trong combo AI.',
    wet: 'Sản phẩm ướt hỗ trợ bổ sung nước và đa dạng khẩu phần.',
    support: 'Sản phẩm bổ trợ giúp khẩu phần phù hợp hơn.',
    treat: 'Topping hoặc snack dùng như phần thưởng nhỏ.',
  };
  return roleLabels[product?.productRole] || 'Sản phẩm AI gợi ý cho thực đơn này.';
}

function BenefitCard({ icon, title, body, tone }) {
  const tones = {
    coral: 'border-[#ffb9aa] text-[#ef927b]',
    purple: 'border-[#8f66ff] text-[#6b43ee]',
    mint: 'border-[#9fe2c6] text-[#75d7a9]',
  };
  return (
    <article className={`rounded-[20px] border bg-white p-8 ${tones[tone]}`}>
      <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-current/15">{icon}</span>
      <h3 className="mt-7 text-xl font-extrabold text-[#33303c]">{title}</h3>
      <p className="mt-4 text-sm font-semibold leading-6 text-[#67616f]">{body}</p>
    </article>
  );
}

function NutritionBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-3 flex justify-between text-sm font-extrabold text-[#5a5562]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#eceaf3]">
        <div className={`h-full rounded-full ${color}`} style={{ width: value === '18g' ? '76%' : value === '8g' ? '46%' : '20%' }} />
      </div>
    </div>
  );
}

function Ingredient({ image, title, body }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-[14px] border border-[#e7e3ee] bg-white">
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div>
        <h4 className="font-extrabold text-[#33303c]">{title}</h4>
        <p className="text-sm font-semibold leading-5 text-[#6c6673]">{body}</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-[#efd6ff] px-16 py-14 text-[#3f2a6b] max-lg:px-6">
      <div className="mx-auto grid max-w-[1160px] grid-cols-[1.2fr_1fr_1fr_280px] gap-12 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div>
          <h2 className="text-3xl font-extrabold">PawWorld</h2>
          <p className="mt-4 text-base font-semibold leading-7">Mỗi bữa ăn<br />Một vòng tay nhân ái.</p>
          <div className="mt-8 flex gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#62c993] font-bold text-white">f</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ffa477] font-bold text-white">♪</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#b7a6ff] font-bold text-white">◎</span>
          </div>
        </div>
        <div>
          <h3 className="font-extrabold uppercase">Sản phẩm</h3>
          <div className="mt-5 grid gap-4 text-sm font-semibold">
            <Link to="/danh-muc">Meal Kit Cá Nhân Hóa</Link>
            <Link to="/danh-muc">Meal Kit cho mèo con</Link>
            <Link to="/danh-muc">Meal Kit cho mèo lớn</Link>
            <Link to="/danh-muc">Phụ Kiện Chăm Sóc</Link>
          </div>
        </div>
        <div>
          <h3 className="font-extrabold uppercase">Hỗ trợ</h3>
          <div className="mt-5 grid gap-4 text-sm font-semibold">
            <Link to="/meow-quizz">Meow Quizz</Link>
            <Link to="/gioi-thieu">Về chúng tôi</Link>
            <Link to="/lien-he-tu-van">Liên hệ tư vấn</Link>
            <Link to="/tra-cuu-don-hang">Chính sách vận chuyển</Link>
          </div>
        </div>
        <div className="rounded-[8px] bg-white p-5">
          <h3 className="font-extrabold uppercase">Đăng ký nhận tin</h3>
          <p className="mt-3 text-xs font-semibold leading-5">Nhận ngay voucher 20k cho đơn hàng đầu tiên!</p>
          <input placeholder="Email của bạn..." className="mt-4 h-10 w-full rounded-full border-2 border-[#8b8794] px-4 text-sm outline-none" />
          <button className="mt-3 h-10 w-full rounded-full bg-[#ffca2d] font-bold text-white">Gửi</button>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1160px] border-t-2 border-[#ffb800] pt-8 text-xs font-semibold">
        © 2026 PawWorld. All rights reserved. Keep on wagging!
      </div>
    </footer>
  );
}

export default function RecommendationPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const addCombo = useCartStore((s) => s.addCombo);
  const [selectedDurationDays, setSelectedDurationDays] = useState(null);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!selectedDurationDays) return;
    let active = true;
    setLoading(true);
    petProfileApi.recommend(profileId, { durationDays: selectedDurationDays })
      .then((response) => {
        if (active) {
          setData(response);
          setActiveProductIndex(0);
        }
      })
      .catch((err) => {
        if (active) toast.error(err?.response?.data?.message || 'Chưa tạo được gợi ý AI');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId, selectedDurationDays]);

  const profile = data?.profile;
  const recommendation = data?.recommendation || profile?.aiSummary || {};
  const products = pickProducts(recommendation);
  const primaryProduct = products[0] || {};
  const carouselProducts = products.length ? products : [primaryProduct];
  const activeProduct = carouselProducts[activeProductIndex] || primaryProduct;
  const hasMultipleCarouselProducts = carouselProducts.length > 1;
  const mainIngredientProducts = useMemo(() => (
    [...products]
      .sort((a, b) => {
        const roleDelta = (PRODUCT_ROLE_ORDER[a?.productRole] ?? 99) - (PRODUCT_ROLE_ORDER[b?.productRole] ?? 99);
        if (roleDelta) return roleDelta;
        return String(a?.name || '').localeCompare(String(b?.name || ''));
      })
      .slice(0, 3)
  ), [products]);
  const catDisplayName = profile?.name || recommendation.petName || 'bé mèo';
  const primaryFoodType = foodTypeLabel(primaryProduct.foodType || recommendation.foodType || profile?.currentFoodType);
  const feedingPlan = Array.isArray(recommendation.feedingPlan) ? recommendation.feedingPlan : [];
  const portionItems = useMemo(() => {
    const grouped = products.reduce((items, product, index) => {
      const role = product?.productRole || `product-${index}`;
      const fallback = PRODUCT_ROLE_PORTIONS[role];
      const current = items.get(role) || {
        key: role,
        role,
        label: product?.roleLabel || fallback?.label || portionLabel(product),
        percent: 0,
        description: product?.servingNote || product?.reason || feedingPlan[index]?.description || `${portionLabel(product)} theo khẩu phần khuyến nghị`,
      };
      current.percent += portionPercent(product);
      items.set(role, current);
      return items;
    }, new Map());

    return Array.from(grouped.values())
      .map((item) => ({ ...item, percent: Math.min(100, item.percent) }))
      .sort((a, b) => {
        const roleDelta = (PRODUCT_ROLE_ORDER[a.role] ?? 99) - (PRODUCT_ROLE_ORDER[b.role] ?? 99);
        if (roleDelta) return roleDelta;
        return b.percent - a.percent;
      });
  }, [feedingPlan, products]);
  const primaryPortionItem = portionItems[0] || {
    key: 'fallback',
    label: primaryFoodType,
    percent: 100,
    description: `${primaryFoodType} theo khẩu phần khuyến nghị`,
  };
  const portionSummary = portionItems.length
    ? portionItems.map((item) => `${formatPortionPercent(item.percent)}% ${item.label}`).join(' / ')
    : `${formatPortionPercent(primaryPortionItem.percent)}% ${primaryPortionItem.label}`;
  const cartableProducts = products.filter(isDbProduct);
  const total = useMemo(() => {
    const explicitTotal = Number(recommendation.total || recommendation.totalPrice || recommendation.estimatedTotal || 0);
    if (explicitTotal > 0 && cartableProducts.length === products.length) return explicitTotal;
    return cartableProducts.reduce((sum, product) => sum + Number(product.price || product.finalPrice || 0) * getProductQuantity(product), 0);
  }, [cartableProducts, products.length, recommendation.estimatedTotal, recommendation.total, recommendation.totalPrice]);

  useEffect(() => {
    if (activeProductIndex >= carouselProducts.length) setActiveProductIndex(0);
  }, [activeProductIndex, carouselProducts.length]);

  function showPreviousProduct() {
    if (!hasMultipleCarouselProducts) return;
    setActiveProductIndex((current) => (current === 0 ? carouselProducts.length - 1 : current - 1));
  }

  function showNextProduct() {
    if (!hasMultipleCarouselProducts) return;
    setActiveProductIndex((current) => (current + 1) % carouselProducts.length);
  }

  const checkout = async () => {
    if (!cartableProducts.length || cartableProducts.length !== products.length) {
      toast.error('Combo hiện chưa có sản phẩm trong danh mục, mời sen chọn sản phẩm phù hợp.');
      navigate('/danh-muc');
      return;
    }
    setAdding(true);
    try {
      await addCombo({
        items: cartableProducts.map((product) => ({
          productId: getProductId(product),
          quantity: getProductQuantity(product),
        })),
        profileId,
        durationDays: selectedDurationDays,
      });
      navigate('/thanh-toan');
    } catch {
      toast.error('Chưa thêm được combo vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  if (!selectedDurationDays) {
    return (
      <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-[#fffefa] px-4 py-12 text-[#33303c]">
        <div className="w-full max-w-[760px] rounded-[30px] bg-[#edd3ff] px-8 py-10 text-center shadow-[0_15px_28px_rgba(39,34,46,0.12)]">
          <h1 className="crayon text-[46px] leading-none text-[#2f1464]">Chọn thời lượng combo</h1>
          <p className="mx-auto mt-5 max-w-[520px] text-base font-semibold leading-7 text-[#716878]">
            PawWorld sẽ tạo thực đơn theo số ngày sen muốn chuẩn bị cho bé.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            {durationOptions.map((option) => (
              <button
                key={option.durationDays}
                type="button"
                onClick={() => setSelectedDurationDays(option.durationDays)}
                className="h-20 rounded-[18px] bg-white text-xl font-extrabold text-[#2f1464] shadow-[0_10px_22px_rgba(39,34,46,0.08)] transition hover:bg-[#fff7d8]"
              >
                {option.label}
              </button>
            ))}
          </div>
          <Link to="/meow-quizz/ho-so" className="mt-8 inline-flex text-sm font-extrabold text-[#6b43ee]">
            Quay lại hồ sơ
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-[#fffefa] px-4">
        <div className="rounded-[24px] bg-white p-10 text-center shadow-lg">
          <h1 className="crayon text-[42px]">AI đang tạo thực đơn...</h1>
          <p className="mt-3 font-semibold text-[#6d6675]">PawWorld đang phân tích hồ sơ và chọn meal kit phù hợp.</p>
        </div>
      </section>
    );
  }

  if (!profile) return null;

  return (
    <section className="bg-[#fffefa] text-[#33303c]">
      <div className="mx-auto max-w-[1160px] px-12 py-12 max-lg:px-5">
        <section className="grid min-h-[376px] grid-cols-[1fr_420px] items-center gap-8 rounded-[30px] bg-[#edd3ff] px-10 py-8 max-lg:grid-cols-1">
          <div>
            <h1 className="crayon text-[50px] leading-[0.95] text-[#2f1464]">
              Thực đơn của {catDisplayName}
              <br />
              đã sẵn sàng!
            </h1>
            <p className="mt-8 max-w-[520px] text-base font-semibold leading-7 text-[#716878]">
              {comboSummaryText(recommendation.summary, catDisplayName, selectedDurationDays)}
            </p>
            <button type="button" onClick={checkout} className="mt-8 h-14 w-[204px] rounded-full bg-[#ffca2d] font-extrabold text-[#6a4a00]">
              Đặt hàng ngay
            </button>
          </div>

          <div className="relative h-[300px] rounded-[30px] border-[6px] border-white bg-[#b993cb] shadow-[0_15px_28px_rgba(39,34,46,0.18)]">
            {hasMultipleCarouselProducts ? (
              <button type="button" aria-label="Ảnh sản phẩm trước" onClick={showPreviousProduct} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-white transition hover:scale-105">
                <ChevronLeft size={42} />
              </button>
            ) : null}
            <img src={activeProduct.image || productFallback} alt={activeProduct.name || 'Meal kit'} className="mx-auto h-full object-contain p-8" />
            {hasMultipleCarouselProducts ? (
              <button type="button" aria-label="Ảnh sản phẩm tiếp theo" onClick={showNextProduct} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-white transition hover:scale-105">
                <ChevronRight size={42} />
              </button>
            ) : null}
            {hasMultipleCarouselProducts ? (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
                {carouselProducts.map((product, index) => (
                  <button
                    key={getProductId(product) || product.fallbackId || product.name || index}
                    type="button"
                    aria-label={`Xem ảnh ${index + 1}`}
                    onClick={() => setActiveProductIndex(index)}
                    className={`h-4 w-4 rounded-full transition ${index === activeProductIndex ? 'bg-white' : 'bg-[#9e9aa4] hover:bg-white/75'}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <h2 className="crayon mt-16 text-center text-[42px] leading-none text-[#25222b]">Lợi ích dinh dưỡng vượt trội</h2>
        <div className="mt-9 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          <BenefitCard icon={<Leaf size={24} />} tone="coral" title="Không ngũ cốc" body={`Công thức đặc biệt giúp giảm nguy cơ dị ứng và hỗ trợ hệ tiêu hóa nhạy cảm của ${catDisplayName}.`} />
          <BenefitCard icon={<Bone size={24} />} tone="purple" title="Khớp khỏe mạnh" body="Bổ sung Glucosamine và Chondroitin để duy trì sự linh hoạt và sức mạnh của khung xương." />
          <BenefitCard icon={<Zap size={24} />} tone="mint" title="Cho mèo năng động" body="Cung cấp nguồn năng lượng sạch từ đạm động vật chất lượng cao cho các hoạt động hằng ngày." />
        </div>

        <div className="mt-14 grid grid-cols-[1fr_360px] gap-6 max-lg:grid-cols-1">
          <section className="rounded-[28px] border border-[#9fe2c6] bg-white p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-xl font-extrabold">Thành phần dinh dưỡng</h3>
                <p className="mt-2 text-sm font-semibold text-[#77717e]">Tỉ lệ cân bằng tối ưu theo khuyến nghị của AAFCO</p>
              </div>
              <div className="text-right text-[#6b43ee]">
                <p className="text-3xl font-extrabold">{caloriesText(recommendation.dailyCalories)}</p>
                <p className="text-xs font-extrabold text-[#77717e]">KCAL/NGÀY</p>
              </div>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-8 max-sm:grid-cols-1">
              <NutritionBar label="Đạm (Protein)" value="18g" color="bg-[#f09a82]" />
              <NutritionBar label="Chất béo (Fats)" value="8g" color="bg-[#70ca9b]" />
              <NutritionBar label="Chất xơ (Fiber)" value="2g" color="bg-[#ffca2d]" />
            </div>
          </section>

          <section className="rounded-[28px] border border-[#ffb9aa] bg-white p-8">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#77717e]">Thành phần chính</h3>
            {mainIngredientProducts.length ? (
              <div className="mt-6 space-y-5">
                {mainIngredientProducts.map((product, index) => (
                  <Ingredient
                    key={getProductId(product) || product.fallbackId || product.name || index}
                    image={product.image || productFallback}
                    title={product.name || 'Sản phẩm AI gợi ý'}
                    body={ingredientBodyText(product)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm font-semibold leading-6 text-[#6c6673]">Sản phẩm AI gợi ý sẽ hiển thị tại đây sau khi có dữ liệu thực đơn.</p>
            )}
          </section>
        </div>

        <section className="mt-14 grid overflow-hidden rounded-[28px] border border-[#e8e4ee] bg-white lg:grid-cols-2">
          <div className="p-12">
            <h3 className="text-2xl font-extrabold">Phân bổ khẩu phần</h3>
            <p className="mt-6 max-w-[360px] text-sm font-semibold leading-6 text-[#77717e]">Combo {selectedDurationDays} ngày phân bổ theo hạt khô, pate dinh dưỡng và phần thưởng nhỏ dựa trên sản phẩm được gợi ý.</p>
            <div className="mt-10 space-y-7">
              {portionItems.map((item, index) => (
                <div key={item.key} className={index === 0 ? 'flex items-start justify-between gap-6' : 'flex items-start justify-between gap-6 text-[#77717e]'}>
                  <span className="flex gap-4">
                    <span className={`mt-1 h-3 w-3 rounded-full ${index === 0 ? 'bg-[#6b43ee]' : index === 1 ? 'bg-[#70ca9b]' : 'bg-[#ffca2d]'}`} />
                    <span>
                      <strong className={`block ${index === 0 ? '' : 'text-[#77717e]'}`}>{item.label}</strong>
                      <span className="text-sm font-semibold text-[#77717e]">{item.description}</span>
                    </span>
                  </span>
                  <strong>{formatPortionPercent(item.percent)}%</strong>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3 rounded-[18px] bg-[#f4efff] p-5 text-sm font-bold leading-6 text-[#6b43ee]">
              <Info className="shrink-0" size={18} />
              Hãy luôn cung cấp đủ nước sạch cho {catDisplayName}. Khẩu phần có thể điều chỉnh sau {selectedDurationDays} ngày tùy thuộc vào cân nặng thực tế.
            </div>
          </div>
          <div className="grid place-items-center bg-[#eeedf6] p-12">
            <div className="grid h-[220px] w-[220px] place-items-center rounded-full border-[16px] border-[#ffca2d] bg-[#f5f3fb] shadow-lg">
              <div className="text-center">
                <Waves className="mx-auto text-[#a98dff]" size={34} />
                <p className="mt-4 px-5 text-xl font-extrabold leading-tight">{portionSummary}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-[28px] border border-[#e8e4ee] bg-white p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-[#77717e]">Combo {selectedDurationDays} ngày</p>
              <h3 className="mt-2 text-2xl font-extrabold">Sản phẩm AI gợi ý</h3>
            </div>
            <span className="rounded-full bg-[#fff4c3] px-4 py-2 text-sm font-extrabold text-[#6a4a00]">
              Định lượng từ tên/gói sản phẩm
            </span>
          </div>

          <div className="mt-7 grid gap-4">
            {products.map((product, index) => (
              <article key={getProductId(product) || product.fallbackId || product.name || index} className="grid gap-4 rounded-[18px] border border-[#eeeaf2] bg-[#fffefa] p-5 md:grid-cols-[88px_1fr_auto] md:items-center">
                <img src={product.image || productFallback} alt={product.name || 'Meal kit'} className="h-[88px] w-[88px] rounded-[16px] object-cover" />
                <div>
                  <h4 className="font-extrabold text-[#33303c]">{product.name || 'Meal kit PawWorld'}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#77717e]">{product.reason}</p>
                  <p className="mt-3 text-sm font-extrabold text-[#6b43ee]">{quantityDetailText(product)}</p>
                  {product?.servingNote ? <p className="mt-1 text-xs font-bold text-[#8c8794]">{product.servingNote}</p> : null}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-extrabold uppercase text-[#9a94a3]">Tạm tính</p>
                  <p className="mt-1 text-lg font-extrabold">{formatPrice(Number(product.price || product.finalPrice || 0) * getProductQuantity(product))}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="sticky bottom-6 z-30 mx-auto mt-16 flex h-[72px] w-[420px] max-w-full items-center justify-center gap-9 rounded-full bg-white px-9 shadow-[0_15px_30px_rgba(39,34,46,0.12)]">
          <div>
            <p className="text-xs font-extrabold text-[#9a94a3]">Tổng cộng dự kiến:</p>
            <p className="text-xl font-extrabold">{formatPrice(total)}</p>
          </div>
          <button type="button" onClick={checkout} disabled={adding} className="inline-flex h-14 min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#ffca2d] font-extrabold disabled:opacity-60">
            <ShoppingBag size={18} />
            {adding ? 'Đang thêm...' : 'Đặt hàng ngay'}
          </button>
        </div>
      </div>

      <Footer />
    </section>
  );
}
