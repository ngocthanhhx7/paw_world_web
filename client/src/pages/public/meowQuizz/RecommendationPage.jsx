import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag, Sparkles } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { profileAgeLabel } from './meowQuizData';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function pickProducts(recommendation) {
  return recommendation?.products || recommendation?.recommendedProducts || [];
}

export default function RecommendationPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    petProfileApi.recommend(profileId).then(setData).catch((err) => toast.error(err?.response?.data?.message || 'Chua tao duoc goi y AI')).finally(() => setLoading(false));
  }, [profileId]);

  const profile = data?.profile;
  const recommendation = data?.recommendation || profile?.aiSummary;
  const products = pickProducts(recommendation);
  const calories = recommendation?.dailyCalories || recommendation?.caloriesPerDay || recommendation?.calorieTarget;
  const summary = recommendation?.summary || recommendation?.overview || recommendation?.healthReview || 'AI dang tong hop tinh trang va de xuat meal kit phu hop voi ho so cua be.';
  const mealPlan = recommendation?.mealPlan || recommendation?.feedingPlan || recommendation?.carePlan || [];

  const checkout = async () => {
    const dbProducts = products.filter((item) => item.productId || item._id);
    if (!dbProducts.length) {
      toast('San pham mau chua co trong kho, dang chuyen den danh muc do an meo');
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
      toast.error('Chua them duoc combo vao gio hang');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="bg-[#f4e9ff] px-4 py-10 text-[#4b3a62]">
      <div className="mx-auto max-w-6xl">
        {loading ? <div className="rounded-[32px] bg-white p-10 text-center text-lg font-black shadow-[0_18px_0_rgba(94,62,130,0.08)]">AI dang tao combo cho be...</div> : null}
        {!loading && profile ? <>
          <div className="mb-6 rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#d29a28]"><Sparkles size={18} /> Ket qua AI</p><h1 className="mt-3 text-4xl font-black text-[#4d2b63]">Meal Kit cho {profile.name}</h1><p className="mt-2 text-sm font-semibold text-[#8b7a9f]">{profile.breed} - {profileAgeLabel(profile)} - {profile.weightKg}kg</p></div>
              <div className="rounded-[24px] bg-[#fff2c7] px-6 py-5 text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b7119]">Calo de xuat</p><p className="mt-1 text-3xl font-black text-[#4b3411]">{calories || 'Theo AI'}<span className="text-sm">/ngay</span></p></div>
            </div>
            <p className="mt-6 rounded-[22px] bg-[#fbf7ff] p-5 text-sm font-semibold leading-7 text-[#6d5b80]">{summary}</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8"><h2 className="text-2xl font-black text-[#4d2b63]">Combo san pham phu hop</h2><div className="mt-5 grid gap-4">{products.length ? products.map((product, index) => <article key={product.productId || product._id || product.id || index} className="flex gap-4 rounded-[22px] border border-[#eadff8] bg-white p-4"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-[18px] bg-[#fff2c7] text-sm font-black text-[#8b6419]">BOX</div><div className="min-w-0 flex-1"><h3 className="font-black text-[#4d2b63]">{product.name}</h3><p className="mt-1 text-sm font-semibold text-[#8b7a9f]">{product.reason || product.description || 'Phu hop voi ho so suc khoe va khau vi cua be.'}</p><p className="mt-2 text-sm font-black text-[#d29a28]">{product.price ? money.format(product.price) : 'Dang cap nhat gia'}</p></div></article>) : <p className="rounded-[22px] bg-[#fbf7ff] p-5 text-sm font-semibold text-[#8b7a9f]">Chua co san pham trong database, AI se dung combo mau de tiep tuc luong.</p>}</div></div>
            <aside className="rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8"><h2 className="text-2xl font-black text-[#4d2b63]">Che do cham soc</h2><div className="mt-5 space-y-3">{Array.isArray(mealPlan) && mealPlan.length ? mealPlan.map((item, index) => <div key={index} className="rounded-[18px] bg-[#fbf7ff] p-4 text-sm font-semibold text-[#6d5b80]">{typeof item === 'string' ? item : item.text || item.title || JSON.stringify(item)}</div>) : <><div className="rounded-[18px] bg-[#fbf7ff] p-4 text-sm font-semibold text-[#6d5b80]">Chia khau phan theo bua va do bang coc tieu chuan.</div><div className="rounded-[18px] bg-[#fbf7ff] p-4 text-sm font-semibold text-[#6d5b80]">Theo doi BCS ly tuong quanh 5/9 va dieu chinh moi 2-3 tuan.</div><div className="rounded-[18px] bg-[#fbf7ff] p-4 text-sm font-semibold text-[#6d5b80]">Bo sung van dong bang do choi phan phoi thuc an.</div></>}</div><button type="button" disabled={adding} onClick={checkout} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f7c64b] text-sm font-black text-[#4b3411] shadow-[0_8px_0_#d79d23]"><ShoppingBag size={18} /> {adding ? 'Dang tao don...' : 'Dat combo nay'}</button><Link to="/meow-quizz/ho-so" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#f7f1ff] text-sm font-bold text-[#6d4b8d]">Quan ly ho so</Link></aside>
          </div>
        </> : null}
      </div>
    </section>
  );
}
