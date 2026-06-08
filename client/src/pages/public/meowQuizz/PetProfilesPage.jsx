import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Edit3, Plus, Trash2 } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import { profileAgeLabel } from './meowQuizData';

export default function PetProfilesPage() {
  const navigate = useNavigate();
  const customer = useCustomerAuthStore((s) => s.customer);
  const ready = useCustomerAuthStore((s) => s.ready);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      navigate('/dang-nhap?redirect=/meow-quizz/ho-so');
      return;
    }
    petProfileApi.list()
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => toast.error('Chưa tải được hồ sơ'))
      .finally(() => setLoading(false));
  }, [customer, navigate, ready]);

  const remove = async () => {
    if (!deleting) return;
    await petProfileApi.remove(deleting._id);
    setProfiles((items) => items.filter((item) => item._id !== deleting._id));
    setDeleting(null);
    toast.success('Đã xoá hồ sơ');
  };

  return (
    <section className="bg-[#f4e9ff] px-4 py-10 text-[#4b3a62]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d29a28]">Meow Quizz</p>
            <h1 className="mt-2 text-4xl font-black text-[#4d2b63]">Thú cưng của tôi</h1>
          </div>
          <Link to="/meow-quizz" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f7c64b] px-6 text-sm font-black text-[#4b3411] shadow-[0_7px_0_#d79d23]"><Plus size={18} /> Thêm hồ sơ</Link>
        </div>
        {loading ? <div className="rounded-[28px] bg-white p-8 font-bold">Đang tải hồ sơ...</div> : null}
        {!loading && profiles.length === 0 ? <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_14px_0_rgba(94,62,130,0.08)]"><h2 className="text-2xl font-black text-[#4d2b63]">Chưa có hồ sơ mèo nào</h2><p className="mt-3 text-sm font-medium text-[#8b7a9f]">Tạo Meow Quizz đầu tiên để AI gợi ý combo chăm sóc phù hợp.</p></div> : null}
        <div className="grid gap-5 md:grid-cols-2">
          {profiles.map((profile) => (
            <article key={profile._id} className="rounded-[28px] bg-white p-6 shadow-[0_14px_0_rgba(94,62,130,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7bb9]">Hồ sơ thú cưng</p>
                  <h2 className="mt-2 text-2xl font-black text-[#4d2b63]">{profile.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-[#8b7a9f]">{profile.breed} - {profileAgeLabel(profile)} - {profile.weightKg}kg</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#fff2c7] text-2xl">M</div>
              </div>
              <div className="mt-5 grid gap-2 text-sm font-semibold text-[#6b587d]"><span>Mục tiêu: {(profile.healthGoals || []).join(', ') || 'Chưa rõ'}</span><span>Vấn đề: {(profile.healthIssues || []).join(', ') || 'Không có'}</span></div>
              <div className="mt-6 flex flex-wrap gap-3"><Link to={`/meow-quizz/ho-so/${profile._id}`} className="rounded-full bg-[#7d58a8] px-5 py-3 text-sm font-black text-white">Xem hồ sơ</Link><Link to={`/meow-quizz/ket-qua/${profile._id}`} className="rounded-full bg-[#f7c64b] px-5 py-3 text-sm font-black text-[#4b3411]">Tạo thực đơn</Link><Link to={`/meow-quizz/ho-so/${profile._id}/chinh-sua`} className="inline-flex items-center gap-2 rounded-full bg-[#f7f1ff] px-5 py-3 text-sm font-bold text-[#6d4b8d]"><Edit3 size={16} /> Sửa</Link><button type="button" onClick={() => setDeleting(profile)} className="inline-flex items-center gap-2 rounded-full bg-[#fff0f0] px-5 py-3 text-sm font-bold text-[#b84b4b]"><Trash2 size={16} /> Xoá</button></div>
            </article>
          ))}
        </div>
      </div>
      {deleting ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"><div className="max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl"><h2 className="text-2xl font-black text-[#4d2b63]">Xoá hồ sơ?</h2><p className="mt-3 text-sm font-medium text-[#8b7a9f]">Hồ sơ của {deleting.name} sẽ bị xoá khỏi danh sách.</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => setDeleting(null)} className="rounded-full bg-[#f7f1ff] px-5 py-3 text-sm font-bold text-[#6d4b8d]">Huỷ</button><button type="button" onClick={remove} className="rounded-full bg-[#f7c64b] px-5 py-3 text-sm font-black text-[#4b3411]">Xoá</button></div></div></div> : null}
    </section>
  );
}
