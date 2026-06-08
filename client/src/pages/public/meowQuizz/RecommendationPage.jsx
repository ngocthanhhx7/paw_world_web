import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Beef, Bone, ChevronLeft, ChevronRight, Info, Leaf, ShieldPlus, ShoppingBag, Sprout, Waves, Zap } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';

const productFallback = '/assets/paw/Cat Food Kit.png';

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

function caloriesText(value) {
  if (!value) return '198';
  if (typeof value === 'number') return String(value);
  if (value.min && value.max) return String(Math.round((Number(value.min) + Number(value.max)) / 2));
  return String(value);
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
  const addToCart = useCartStore((s) => s.addToCart);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    petProfileApi.recommend(profileId)
      .then((response) => {
        if (active) setData(response);
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
  }, [profileId]);

  const profile = data?.profile;
  const recommendation = data?.recommendation || profile?.aiSummary || {};
  const products = pickProducts(recommendation);
  const primaryProduct = products[0] || {};
  const total = useMemo(() => {
    const productTotal = products.reduce((sum, product) => sum + Number(product.price || product.finalPrice || 0), 0);
    return productTotal || 450000;
  }, [products]);

  const checkout = async () => {
    const dbProducts = products.filter(isDbProduct);
    if (!dbProducts.length) {
      navigate('/danh-muc');
      return;
    }
    setAdding(true);
    try {
      await addToCart(getProductId(dbProducts[0]), 1);
      navigate('/thanh-toan');
    } catch {
      toast.error('Chưa thêm được combo vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

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
              Thực đơn của {profile.name || 'Milo'}
              <br />
              đã sẵn sàng!
            </h1>
            <p className="mt-8 max-w-[520px] text-base font-semibold leading-7 text-[#716878]">
              {recommendation.summary || `Dựa trên thông tin về ${profile.name}, chúng tôi đã thiết kế một công thức dinh dưỡng khoa học giúp bé phát triển toàn diện và luôn khỏe mạnh.`}
            </p>
            <button type="button" onClick={checkout} className="mt-8 h-14 w-[204px] rounded-full bg-[#ffca2d] font-extrabold text-[#6a4a00]">
              Đặt hàng ngay
            </button>
          </div>

          <div className="relative h-[300px] rounded-[30px] border-[6px] border-white bg-[#b993cb] shadow-[0_15px_28px_rgba(39,34,46,0.18)]">
            <button className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-white">
              <ChevronLeft size={42} />
            </button>
            <img src={primaryProduct.image || productFallback} alt={primaryProduct.name || 'Meal kit'} className="mx-auto h-full object-contain p-8" />
            <button className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center text-white">
              <ChevronRight size={42} />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
              <span className="h-4 w-4 rounded-full bg-white" />
              <span className="h-4 w-4 rounded-full bg-[#9e9aa4]" />
              <span className="h-4 w-4 rounded-full bg-[#9e9aa4]" />
            </div>
          </div>
        </section>

        <h2 className="crayon mt-16 text-center text-[42px] leading-none text-[#25222b]">Lợi ích dinh dưỡng vượt trội</h2>
        <div className="mt-9 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          <BenefitCard icon={<Leaf size={24} />} tone="coral" title="Không ngũ cốc" body={`Công thức đặc biệt giúp giảm nguy cơ dị ứng và hỗ trợ hệ tiêu hóa nhạy cảm của ${profile.name}.`} />
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
            <div className="mt-6 space-y-5">
              <Ingredient image="/assets/cat/image 649.png" title="Thịt gà tươi" body="Cung cấp đạm nạc dễ hấp thu" />
              <Ingredient image="/assets/cat/image 650.png" title="Cà rốt" body="Nguồn chất xơ lành mạnh" />
            </div>
          </section>
        </div>

        <section className="mt-14 grid overflow-hidden rounded-[28px] border border-[#e8e4ee] bg-white lg:grid-cols-2">
          <div className="p-12">
            <h3 className="text-2xl font-extrabold">Phân bổ khẩu phần</h3>
            <p className="mt-6 max-w-[360px] text-sm font-semibold leading-6 text-[#77717e]">Kết hợp hoàn hảo giữa thức ăn hạt và Pate để tối ưu hóa lượng nước và dinh dưỡng.</p>
            <div className="mt-10 space-y-7">
              <div className="flex items-start justify-between gap-6">
                <span className="flex gap-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#6b43ee]" />
                  <span>
                    <strong className="block">Thức ăn khô (Hạt)</strong>
                    <span className="text-sm font-semibold text-[#77717e]">53g / ngày (khoảng 1 bát đầy)</span>
                  </span>
                </span>
                <strong>100%</strong>
              </div>
              <div className="flex items-start justify-between gap-6 text-[#77717e]">
                <span className="flex gap-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#e1dfe8]" />
                  <span>
                    <strong className="block text-[#77717e]">Thức ăn ướt (Pate)</strong>
                    <span className="text-sm font-semibold">Hiện tại không khuyến nghị cho Pun</span>
                  </span>
                </span>
                <strong>0%</strong>
              </div>
            </div>
            <div className="mt-8 flex gap-3 rounded-[18px] bg-[#f4efff] p-5 text-sm font-bold leading-6 text-[#6b43ee]">
              <Info className="shrink-0" size={18} />
              Hãy luôn cung cấp đủ nước sạch cho Pun. Khẩu phần có thể điều chỉnh sau 5-12 tuần tùy thuộc vào cân nặng thực tế.
            </div>
          </div>
          <div className="grid place-items-center bg-[#eeedf6] p-12">
            <div className="grid h-[220px] w-[220px] place-items-center rounded-full border-[16px] border-[#ffca2d] bg-[#f5f3fb] shadow-lg">
              <div className="text-center">
                <Waves className="mx-auto text-[#a98dff]" size={34} />
                <p className="mt-4 text-2xl font-extrabold">100% Khô</p>
              </div>
            </div>
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
