import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit3, Plus, Square, Trash2 } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import { activityOptions, profileAgeLabel } from './meowQuizData';

const fallbackCat = '/assets/cat/image 652.png';

function activityLabel(value) {
  return activityOptions.find((option) => option.value === value)?.label || 'năng động';
}

function ProfileCard({ profile, onDelete, onCreateCombo }) {
  return (
    <article className="relative h-[462px] w-[354px] rounded-[26px] border-2 border-[#d7d0bf] bg-white p-6 shadow-[0_16px_30px_rgba(39,34,46,0.08)]">
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <Link to={`/meow-quizz/ho-so/${profile._id}/chinh-sua`} className="grid h-40 w-40 max-h-10 max-w-10 place-items-center rounded-full bg-[#f5dcea] text-[#1f1b26]">
          <Edit3 size={17} />
        </Link>
        <button type="button" onClick={onDelete} className="grid h-10 w-10 place-items-center rounded-full bg-[#9cdcc4] text-[#1f1b26]">
          <Trash2 size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={onCreateCombo}
        className="absolute right-4 top-4 z-10 h-10 rounded-full bg-[#ffca2d] px-4 text-sm font-extrabold text-[#1f1b26]"
      >
        Tạo combo
      </button>

      <div className="h-[298px] overflow-hidden rounded-[24px] bg-[#d9d0c2]">
        <img src={profile.photoUrl || fallbackCat} alt={profile.name} className="h-full w-full object-cover" />
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-[#ebe8e1] pb-4">
        <h2 className="text-[24px] font-extrabold text-[#17151b]">{profile.name || 'Pun'}</h2>
        <span className="rounded-full bg-[#d7f6ed] px-4 py-2 text-sm font-bold text-[#8d9a93]">{profileAgeLabel(profile)}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-5 text-sm font-semibold text-[#817b82]">
        <span className="inline-flex items-center gap-2">
          <Square size={14} />
          {profile.weightKg || 3} kg
        </span>
        <span className="inline-flex items-center gap-2">
          <Square size={14} />
          {activityLabel(profile.activityLevel)}
        </span>
      </div>
    </article>
  );
}

function AddCard() {
  return (
    <Link
      to="/meow-quizz"
      className="grid h-[462px] w-[338px] place-items-center rounded-[26px] border-2 border-dashed border-[#8d877d] bg-white text-center"
    >
      <span>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffca2d] text-[#141218]">
          <Plus size={30} strokeWidth={2.8} />
        </span>
        <span className="mt-8 block text-[24px] font-extrabold text-[#746c34]">Thêm bé mèo</span>
        <span className="mt-4 block text-base font-medium text-[#5b565a]">chào đón bé mèo mới</span>
      </span>
    </Link>
  );
}

function DeleteModal({ profile, onCancel, onConfirm }) {
  if (!profile) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#ebebeb]/75 px-4">
      <div className="w-full max-w-[512px] rounded-[16px] bg-white px-8 py-10 shadow-[0_22px_46px_rgba(39,34,46,0.16)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="crayon text-[26px] leading-none text-[#1e1b24]">Xóa hồ sơ</h2>
            <p className="mt-10 max-w-[360px] text-lg leading-8 text-[#655f61]">
              Bạn có chắc muốn xóa hồ sơ thú cưng này không?
              <br />
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-[#1f1b26]" aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="mt-12 flex items-center justify-end gap-12">
          <button type="button" onClick={onCancel} className="text-2xl font-extrabold text-[#1f1b26]">
            Hủy
          </button>
          <button type="button" onClick={onConfirm} className="h-16 w-[204px] rounded-full bg-[#ffca2d] text-2xl font-extrabold text-[#1f1b26]">
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#fffefa] px-16 py-16 text-[#1d1a22] max-lg:px-5">
      <div className="pointer-events-none absolute -left-12 top-28 hidden h-[250px] w-[250px] -rotate-[26deg] opacity-[0.08] lg:block">
        <img src="/assets/icon/khac/pets.svg" alt="" className="h-full w-full" />
      </div>

      <h1 className="crayon text-center text-[56px] leading-none text-[#1f1d27]">Thú cưng của tôi</h1>

      <div className="mx-auto mt-14 flex max-w-[1152px] items-start gap-14 max-lg:flex-wrap max-lg:justify-center">
        {loading ? <div className="rounded-2xl bg-white px-8 py-6 font-bold">Đang tải hồ sơ...</div> : null}
        {!loading && profiles.length === 0 ? <AddCard /> : null}
        {!loading && profiles.map((profile) => (
          <ProfileCard
            key={profile._id}
            profile={profile}
            onDelete={() => setDeleting(profile)}
            onCreateCombo={() => navigate(`/meow-quizz/ket-qua/${profile._id}`)}
          />
        ))}
        {!loading && profiles.length > 0 ? <AddCard /> : null}
      </div>

      <div className="mx-auto mt-12 flex max-w-[1152px] items-center justify-start max-sm:flex-col max-sm:gap-5">
        <button type="button" onClick={() => navigate('/meow-quizz')} className="inline-flex h-[52px] min-w-[172px] items-center justify-center gap-3 rounded-full border-2 border-[#d6d0c3] bg-white text-base font-bold text-[#817b74]">
          <ArrowLeft size={20} />
          Trở lại
        </button>
      </div>

      <DeleteModal profile={deleting} onCancel={() => setDeleting(null)} onConfirm={remove} />
    </section>
  );
}
