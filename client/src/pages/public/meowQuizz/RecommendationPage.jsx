import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, CheckCircle2, Flame, ShoppingBag, Sparkles, Utensils } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { profileAgeLabel } from './meowQuizData';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function pickProducts(recommendation) {
  return recommendation?.products || recommendation?.recommendedProducts || [];
}

function planText(item) {
  if (typeof item === 'string') return item;
  return item?.text || item?.title || item?.description || JSON.stringify(item);
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
      .then((response) => { if (active) setData(response); })
      .catch((err) => { if (active) toast.error(err?.response?.data?.message || 'Chưa tạo được gợi ý AI'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profileId]);

  const profile = data?.profile;
  const recommendation = data?.recommendation || profile?.aiSummary || {};
  const products = pickProducts(recommendation);
  const calories = recommendation?.dailyCalories || recommendation?.caloriesPerDay || recommendation?.calorieTarget;
  const calorieLabel = typeof calories === 'object' && calories ? `${calories.min || '?'}-${calories.max || '?'} kcal` : calories;
  const summary = recommendation?.summary || recommendation?.overview || recommendation?.healthReview || 'AI đang tổng hợp tình trạng và đề xuất meal kit phù hợp với hồ sơ của bé.';
  const mealPlan = recommendation?.mealPlan || recommendation?.feedingPlan || recommendation?.carePlan || [];
  const planItems = Array.isArray(mealPlan) && mealPlan.length ? mealPlan : [
    'Chia khẩu phần theo bữa và đo bằng cốc tiêu chuẩn.',
    'Theo dõi BCS lý tưởng quanh 5/9 và điều chỉnh mỗi 2-3 tuần.',
    'Bổ sung vận động bằng đồ chơi phân phối thức ăn.',
  ];

  const checkout = async () => {
    const dbProducts = products.filter((item) => item.productId || item._id);
    if (!dbProducts.length) {
      toast('Chưa có sản phẩm DB trong gợi ý, đang chuyển sang danh mục phù hợp');
      navigate('/danh-muc');
      return;
    }
    setAdding(true);
    try {
      for (const item of dbProducts.slice(0, 3)) {
        await addToCart(item.productId || item._id, 1);
      }
      navigate('/thanh-toan');
    } catch {
      toast.error('Chưa thêm được combo vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#f4e9ff] px-4 py-8 text-[#4b3a62] sm:py-12">
      <div className="pointer-events-none absolute left-6 top-24 text-7xl font-black text-white/45">paw</div>
      <div className="pointer-events-none absolute bottom-16 right-8 text-8xl font-black text-white/55">paw</div>
      <div className="mx-auto max-w-6xl">
        {loading ? (
          <div className="rounded-[36px] bg-white p-10 text-center shadow-[0_18px_0_rgba(94,62,130,0.08)]">
            <Sparkles className="mx-auto text-[#f0b83c]" size={34} />
            <h1 className="mt-4 text-3xl font-black text-[#4d2b63]">AI đang tạo thực đơn cho bé...</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#8b7a9f]">PawWorld đang review hồ sơ, tính calo/ngày và chọn meal kit phù hợp nhất từ sản phẩm hiện có.</p>
          </div>
        ) : null}

        {!loading && profile ? (
          <>
            <div className="mb-6 flex items-center justify-between gap-3">
              <button type="button" onClick={() => navigate(`/meow-quizz/ho-so/${profile._id}`)} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6d4b8d] shadow-[0_7px_0_rgba(94,62,130,0.08)]"><ArrowLeft size={20} /></button>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d29a28]">Giai đoạn 2</p>
                <h1 className="mt-1 text-3xl font-black text-[#4d2b63] sm:text-5xl">Thực đơn của {profile.name}</h1>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#f0b83c] shadow-[0_7px_0_rgba(94,62,130,0.08)]"><Sparkles size={21} /></span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <aside className="space-y-5">
                <section className="rounded-[36px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
                  <div className="flex items-center gap-4">
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[24px] bg-[#fbf7ff] text-3xl font-black text-[#8c5bc4]">
                      {profile.photoUrl ? <img src={profile.photoUrl} alt={`Ảnh của ${profile.name}`} className="h-full w-full object-cover" /> : String(profile.name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a7bb9]">Hồ sơ đã phân tích</p>
                      <h2 className="mt-1 text-2xl font-black text-[#4d2b63]">{profile.name}</h2>
                      <p className="mt-1 text-sm font-bold text-[#8b7a9f]">{profile.breed || 'Mèo'} · {profileAgeLabel(profile)} · {profile.weightKg}kg</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-[26px] bg-[#fff2c7] px-6 py-5 text-center">
                    <Flame className="mx-auto text-[#d29a28]" size={24} />
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#9b7119]">Calo đề xuất</p>
                    <p className="mt-1 text-3xl font-black text-[#4b3411]">{calorieLabel || 'Theo AI'}<span className="text-sm">/ngày</span></p>
                  </div>
                  <p className="mt-5 rounded-[22px] bg-[#fbf7ff] p-5 text-sm font-semibold leading-7 text-[#6d5b80]">{summary}</p>
                </section>

                <section className="rounded-[36px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fbf7ff] text-[#7d58a8]"><CalendarDays size={20} /></span>
                    <h2 className="text-2xl font-black text-[#4d2b63]">Lịch chăm sóc</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {planItems.map((item, index) => (
                      <div key={index} className="flex gap-3 rounded-[20px] bg-[#fbf7ff] p-4 text-sm font-semibold leading-6 text-[#6d5b80]">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-[#7d58a8]">{index + 1}</span>
                        <span>{planText(item)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>

              <section className="rounded-[36px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff2c7] text-[#8b6419]"><Utensils size={20} /></span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d29a28]">Meal Kit đề xuất</p>
                    <h2 className="text-2xl font-black text-[#4d2b63]">Combo thức ăn phù hợp</h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {products.length ? products.map((product, index) => (
                    <article key={product.productId || product._id || product.id || index} className="grid gap-4 rounded-[26px] border border-[#eadff8] bg-white p-4 shadow-[0_8px_0_rgba(94,62,130,0.04)] sm:grid-cols-[112px_1fr]">
                      <div className="grid aspect-square place-items-center overflow-hidden rounded-[22px] bg-[#fff2c7] text-sm font-black text-[#8b6419]">
                        {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <span>BOX {index + 1}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-black leading-6 text-[#4d2b63]">{product.name}</h3>
                          <span className="rounded-full bg-[#fbf7ff] px-3 py-1 text-xs font-black uppercase text-[#7d58a8]">{product.foodType || 'kit'}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#8b7a9f]">{product.reason || product.description || 'Phù hợp với hồ sơ sức khỏe và khẩu vị của bé.'}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-base font-black text-[#d29a28]">{product.price ? money.format(product.price) : 'Đang cập nhật giá'}</p>
                          <CheckCircle2 className="text-[#78a85a]" size={20} />
                        </div>
                      </div>
                    </article>
                  )) : (
                    <p className="rounded-[22px] bg-[#fbf7ff] p-5 text-sm font-semibold text-[#8b7a9f]">Chưa có sản phẩm trong database, AI sẽ dùng combo mẫu để tiếp tục luồng.</p>
                  )}
                </div>

                <button type="button" disabled={adding} onClick={checkout} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f7c64b] text-sm font-black text-[#4b3411] shadow-[0_8px_0_#d79d23] transition hover:-translate-y-0.5 disabled:opacity-60">
                  <ShoppingBag size={18} /> {adding ? 'Đang tạo đơn...' : 'Đặt combo này'}
                </button>
                <Link to="/meow-quizz/ho-so" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#f7f1ff] text-sm font-bold text-[#6d4b8d]">Quản lý hồ sơ</Link>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
