import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Bone, Camera, HeartPulse, Pencil, Sparkles, Utensils } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import { activityOptions, foodTypeOptions, healthGoalOptions, profileAgeLabel, weightGoalOptions } from './meowQuizData';

function labelOf(options, value, fallback = 'Chưa rõ') {
  return options.find((item) => item.value === value)?.label || fallback;
}

function joinList(value, fallback = 'Không ghi nhận') {
  if (Array.isArray(value) && value.length) return value.join(', ');
  if (typeof value === 'string' && value.trim()) return value;
  return fallback;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[22px] bg-white/85 px-5 py-4 shadow-[0_8px_0_rgba(94,62,130,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9a7bb9]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#4d2b63]">{value}</p>
    </div>
  );
}

export default function PetProfileDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = useCustomerAuthStore((s) => s.customer);
  const ready = useCustomerAuthStore((s) => s.ready);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      navigate('/dang-nhap?redirect=' + encodeURIComponent(`/meow-quizz/ho-so/${id}`));
      return;
    }
    petProfileApi.get(id)
      .then((data) => setProfile(data.profile))
      .catch((err) => toast.error(err?.response?.data?.message || 'Chưa tải được hồ sơ'))
      .finally(() => setLoading(false));
  }, [customer, id, navigate, ready]);

  if (loading) {
    return <section className="bg-[#f4e9ff] px-4 py-10"><div className="mx-auto max-w-5xl rounded-[32px] bg-white p-10 text-center font-black text-[#4d2b63] shadow-[0_18px_0_rgba(94,62,130,0.08)]">Đang mở hồ sơ của bé...</div></section>;
  }

  if (!profile) return null;

  const goals = (profile.healthGoals || []).map((goal) => labelOf(healthGoalOptions, goal, goal));
  const avatarLetter = String(profile.name || 'M').trim().charAt(0).toUpperCase();

  return (
    <section className="relative overflow-hidden bg-[#f4e9ff] px-4 py-8 text-[#4b3a62] sm:py-12">
      <div className="pointer-events-none absolute left-6 top-24 text-7xl font-black text-white/45">paw</div>
      <div className="pointer-events-none absolute bottom-16 right-8 text-8xl font-black text-white/55">paw</div>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/meow-quizz/ho-so')} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6d4b8d] shadow-[0_7px_0_rgba(94,62,130,0.08)]"><ArrowLeft size={20} /></button>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d29a28]">Giai đoạn 1 hoàn tất</p>
            <h1 className="mt-1 text-3xl font-black text-[#4d2b63] sm:text-5xl">Hồ sơ thú cưng</h1>
          </div>
          <Link to={`/meow-quizz/ho-so/${profile._id}/chinh-sua`} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6d4b8d] shadow-[0_7px_0_rgba(94,62,130,0.08)]"><Pencil size={18} /></Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[36px] bg-white p-6 text-center shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
            <div className="mx-auto grid h-56 w-56 place-items-center overflow-hidden rounded-[36px] bg-[#fbf7ff] text-6xl font-black text-[#8c5bc4] shadow-[0_10px_0_rgba(94,62,130,0.08)]">
              {profile.photoUrl ? <img src={profile.photoUrl} alt={`Ảnh của ${profile.name}`} className="h-full w-full object-cover" /> : <span>{avatarLetter || <Camera size={52} />}</span>}
            </div>
            <h2 className="mt-6 text-4xl font-black text-[#4d2b63]">{profile.name}</h2>
            <p className="mt-2 text-sm font-bold text-[#8b7a9f]">{profile.breed || 'Mèo chưa rõ giống'} · {profileAgeLabel(profile)}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatCard label="Cân nặng" value={`${profile.weightKg || 0} kg`} />
              <StatCard label="Giới tính" value={profile.sex === 'female' ? 'Cô bé' : 'Chú bé'} />
            </div>
            <Link to={`/meow-quizz/ket-qua/${profile._id}`} className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f7c64b] text-sm font-black text-[#4b3411] shadow-[0_8px_0_#d79d23] transition hover:-translate-y-0.5">
              <Sparkles size={18} /> Tạo thực đơn cho bé
            </Link>
          </article>

          <div className="space-y-5">
            <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff2c7] text-[#8b6419]"><HeartPulse size={20} /></span>
                <h3 className="text-2xl font-black text-[#4d2b63]">Tình trạng hiện tại</h3>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatCard label="Dị ứng" value={profile.noAllergies ? 'Không có dị ứng' : joinList(profile.allergies)} />
                <StatCard label="Vấn đề sức khỏe" value={joinList(profile.healthIssues)} />
                <StatCard label="Mục tiêu" value={goals.length ? goals.join(', ') : 'Chưa chọn'} />
                <StatCard label="Hoạt động" value={labelOf(activityOptions, profile.activityLevel)} />
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fbf7ff] text-[#7d58a8]"><Utensils size={20} /></span>
                <h3 className="text-2xl font-black text-[#4d2b63]">Thói quen ăn uống</h3>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatCard label="Kiểu ăn" value={labelOf(foodTypeOptions, profile.currentFoodType)} />
                <StatCard label="Cân nặng" value={labelOf(weightGoalOptions, profile.weightGoal)} />
                <StatCard label="Vị yêu thích" value={joinList(profile.favoriteFlavors, 'Để AI cân bằng')} />
              </div>
            </div>

            <div className="rounded-[28px] bg-[#fff2c7] p-5 text-sm font-bold leading-6 text-[#6f4b14] shadow-[0_10px_0_rgba(117,75,23,0.08)]">
              <Bone className="mr-2 inline" size={18} />
              Hồ sơ đã sẵn sàng. AI sẽ dùng dữ liệu này để review sức khỏe, ước tính calo/ngày, chọn meal kit từ database sản phẩm và fallback mock nếu dữ liệu chưa đủ.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
