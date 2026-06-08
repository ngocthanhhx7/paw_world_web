import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Camera, Check, Sparkles, Upload } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import {
  activityOptions,
  foodTypeOptions,
  healthGoalOptions,
  initialQuizForm,
  normalizeQuizPayload,
  weightGoalOptions,
} from './meowQuizData';

const DRAFT_KEY = 'paw_meow_quizz_draft';
const RESUME_KEY = 'paw_meow_quizz_resume';

const steps = [
  { key: 'name', title: 'Tên của bé mèo?', hint: 'Nhập tên thân mật để AI tạo hồ sơ riêng cho bé.' },
  { key: 'sex', title: 'Bé là một...', hint: 'Thông tin này giúp gợi ý cá nhân hóa hơn.' },
  { key: 'age', title: 'Bé bao nhiêu tuổi nè?', hint: 'Tuổi tác ảnh hưởng trực tiếp tới năng lượng và chế độ ăn.' },
  { key: 'breed', title: 'Bé thuộc giống mèo gì nhỉ?', hint: 'Nếu chưa rõ, sen có thể nhập mèo ta hoặc chưa rõ.' },
  { key: 'weight', title: 'Hiện tại bé nặng bao nhiêu kg?', hint: 'Cân nặng giúp ước tính calo mỗi ngày chính xác hơn.' },
  { key: 'allergies', title: 'Bé có dị ứng với món ăn gì không sen?', hint: 'AI sẽ tránh các thành phần không phù hợp.' },
  { key: 'health', title: 'Bé có vấn đề sức khỏe nào không nè?', hint: 'Ghi ngắn gọn các tình trạng đang quan tâm.' },
  { key: 'goals', title: 'Sen đang có mục tiêu sức khỏe nào cho bé?', hint: 'Có thể chọn nhiều mục tiêu cùng lúc.' },
  { key: 'activity', title: 'Bé có thường xuyên hoạt động không nè?', hint: 'Mức độ vận động sẽ điều chỉnh khẩu phần phù hợp.' },
  { key: 'food', title: 'Khẩu vị và bữa ăn hiện tại của bé?', hint: 'Bước cuối để AI tạo meal kit và combo sản phẩm.' },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function OptionButton({ selected, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'min-h-[58px] rounded-[18px] border px-5 text-left text-sm font-semibold transition',
        selected
          ? 'border-[#f0b83c] bg-[#fff2c7] text-[#5b3f1a] shadow-[0_8px_0_rgba(117,75,23,0.12)]'
          : 'border-[#eadff8] bg-white text-[#5d4d72] hover:border-[#d7baf4] hover:bg-[#fbf7ff]',
      )}
    >
      <span className="flex items-center justify-between gap-3">
        {children}
        {selected ? <Check size={18} /> : null}
      </span>
    </button>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="h-14 w-full rounded-[18px] border border-[#eadff8] bg-white px-5 text-base font-semibold text-[#4b3a62] outline-none transition placeholder:text-[#b5a8c8] focus:border-[#c69bed] focus:ring-4 focus:ring-[#ead7ff] disabled:bg-[#f7f2fb]"
    />
  );
}

export default function MeowQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = useCustomerAuthStore((s) => s.customer);
  const authReady = useCustomerAuthStore((s) => s.ready);
  const [form, setForm] = useState(initialQuizForm);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const resumeStep = sessionStorage.getItem(RESUME_KEY);
    if (!raw) return;
    try {
      setForm({ ...initialQuizForm, ...JSON.parse(raw) });
      if (resumeStep) setStep(Number(resumeStep) || 0);
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(RESUME_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resume') === '1') toast.success('Đã quay lại Meow Quizz');
  }, [location.search]);

  const current = steps[step];
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const toggleGoal = (value) => {
    setForm((prev) => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(value)
        ? prev.healthGoals.filter((item) => item !== value)
        : [...prev.healthGoals, value],
    }));
  };

  const canContinue = () => {
    if (current.key === 'name') return form.name.trim().length >= 1;
    if (current.key === 'sex') return Boolean(form.sex);
    if (current.key === 'age') return Number(form.ageYears || 0) > 0 || Number(form.ageMonths || 0) > 0;
    if (current.key === 'breed') return form.breed.trim().length >= 1;
    if (current.key === 'weight') return Number(form.weightKg || 0) > 0;
    if (current.key === 'goals') return form.healthGoals.length > 0;
    if (current.key === 'activity') return Boolean(form.activityLevel);
    if (current.key === 'food') return Boolean(form.currentFoodType) && Boolean(form.weightGoal);
    if (current.key === 'photo') return true;
    return true;
  };

  const saveDraft = () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    sessionStorage.setItem(RESUME_KEY, String(step));
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploadingPhoto(true);
    try {
      const data = await petProfileApi.uploadPhoto(formData);
      update({ photoUrl: data.photoUrl });
      toast.success('?? t?i ?nh c?a b?');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Ch?a t?i ???c ?nh');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async () => {
    if (!canContinue()) {
      toast.error('Sen điền thêm thông tin để tiếp tục nhé');
      return;
    }
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    if (!authReady) return;
    if (!customer) {
      saveDraft();
      navigate('/dang-nhap?redirect=' + encodeURIComponent('/meow-quizz?resume=1'));
      return;
    }
    setSaving(true);
    try {
      const data = await petProfileApi.create(normalizeQuizPayload(form));
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(RESUME_KEY);
      toast.success('Đã tạo hồ sơ cho bé');
      navigate(`/meow-quizz/ket-qua/${data.profile._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chưa lưu được hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (current.key === 'name') {
      return <TextInput value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Ví dụ: Mochi" autoFocus />;
    }
    if (current.key === 'sex') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <OptionButton selected={form.sex === 'female'} onClick={() => update({ sex: 'female' })}>Cô bé ngoan</OptionButton>
          <OptionButton selected={form.sex === 'male'} onClick={() => update({ sex: 'male' })}>Chú bé ngoan</OptionButton>
        </div>
      );
    }
    if (current.key === 'age') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput type="number" min="0" value={form.ageYears} onChange={(e) => update({ ageYears: e.target.value })} placeholder="Năm" />
          <TextInput type="number" min="0" max="11" value={form.ageMonths} onChange={(e) => update({ ageMonths: e.target.value })} placeholder="Tháng" />
        </div>
      );
    }
    if (current.key === 'breed') return <TextInput value={form.breed} onChange={(e) => update({ breed: e.target.value })} placeholder="Ví dụ: Mèo Anh lông ngắn" />;
    if (current.key === 'weight') return <TextInput type="number" min="0" step="0.1" value={form.weightKg} onChange={(e) => update({ weightKg: e.target.value })} placeholder="Ví dụ: 4.2" />;
    if (current.key === 'allergies') {
      return (
        <div className="space-y-4">
          <OptionButton selected={form.noAllergies} onClick={() => update({ noAllergies: !form.noAllergies, allergies: '' })}>Bé không có dị ứng</OptionButton>
          <TextInput disabled={form.noAllergies} value={form.allergies} onChange={(e) => update({ allergies: e.target.value, noAllergies: false })} placeholder="Nhập các món, cách nhau bằng dấu phẩy" />
        </div>
      );
    }
    if (current.key === 'health') return <TextInput value={form.healthIssues} onChange={(e) => update({ healthIssues: e.target.value })} placeholder="Ví dụ: lông rụng, tiêu hóa kém" />;
    if (current.key === 'goals') {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {healthGoalOptions.map((option) => (
            <OptionButton key={option.value} selected={form.healthGoals.includes(option.value)} onClick={() => toggleGoal(option.value)}>
              <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7eaff] text-[#8c5bc4]">{option.icon}</span>{option.label}</span>
            </OptionButton>
          ))}
        </div>
      );
    }
    if (current.key === 'activity') {
      return <div className="grid gap-4">{activityOptions.map((option) => <OptionButton key={option.value} selected={form.activityLevel === option.value} onClick={() => update({ activityLevel: option.value })}>{option.label}</OptionButton>)}</div>;
    }
    if (current.key === 'food') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">{weightGoalOptions.map((option) => <OptionButton key={option.value} selected={form.weightGoal === option.value} onClick={() => update({ weightGoal: option.value })}>{option.label}</OptionButton>)}</div>
          <div className="grid gap-4 sm:grid-cols-3">{foodTypeOptions.map((option) => <OptionButton key={option.value} selected={form.currentFoodType === option.value} onClick={() => update({ currentFoodType: option.value })}>{option.label}</OptionButton>)}</div>
          <TextInput value={form.favoriteFlavors} onChange={(e) => update({ favoriteFlavors: e.target.value })} placeholder="V? d?: g?, c? ng?, b?..." />
        </div>
      );
    }
    return (
      <div className="space-y-5 text-center">
        {form.photoUrl ? <img src={form.photoUrl} alt="?nh b? m?o" className="mx-auto h-44 w-44 rounded-[28px] object-cover shadow-[0_10px_0_rgba(94,62,130,0.08)]" /> : <div className="mx-auto grid h-44 w-44 place-items-center rounded-[28px] bg-[#fbf7ff] text-[#8c5bc4]"><Camera size={46} /></div>}
        <label className="mx-auto flex h-14 max-w-sm cursor-pointer items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#d8c2ed] bg-[#fbf7ff] text-sm font-bold text-[#765a94]">
          <Upload size={18} /> {uploadingPhoto ? '?ang t?i ?nh...' : form.photoUrl ? '??i ?nh c?a b?' : 'Chia s? h?nh ?nh c?a b?'}
          <input type="file" accept="image/*" className="sr-only" disabled={uploadingPhoto} onChange={(event) => uploadPhoto(event.target.files?.[0])} />
        </label>
        <button type="button" onClick={() => update({ photoUrl: '' })} className="text-xs font-bold text-[#8b7a9f] disabled:opacity-40" disabled={!form.photoUrl}>B? ?nh hi?n t?i</button>
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-[#f4e9ff] px-4 py-8 text-[#4b3a62] sm:py-12">
      <div className="pointer-events-none absolute left-8 top-24 text-6xl text-white/50">paw</div>
      <div className="pointer-events-none absolute bottom-16 right-10 text-7xl text-white/60">paw</div>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[26px] bg-white px-5 py-4 shadow-[0_14px_0_rgba(94,62,130,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/')} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f1ff] text-[#6d4b8d]"><ArrowLeft size={20} /></button>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#9a7bb9]"><span>Meow Quizz</span><span>BƯỚC {step + 1} TRÊN {steps.length}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-[#f1e6fb]"><div className="h-full rounded-full bg-[#f7c64b] transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
            <Sparkles className="text-[#f0b83c]" size={26} />
          </div>
        </div>
        <div className="rounded-[34px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#d29a28]">Hồ sơ thú cưng</p>
            <h1 className="text-3xl font-black text-[#4d2b63] sm:text-5xl">{current.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-[#8b7a9f]">{current.hint}</p>
          </div>
          <div className="mx-auto max-w-2xl">{renderStep()}</div>
          <div className="mt-10 flex items-center justify-between gap-4">
            <button type="button" disabled={step === 0 || saving} onClick={() => setStep((value) => value - 1)} className="flex h-13 items-center gap-2 rounded-full px-5 text-sm font-bold text-[#7c6795] disabled:opacity-40"><ArrowLeft size={18} /> Quay lại</button>
            <button type="button" disabled={saving} onClick={submit} className="flex h-14 items-center gap-2 rounded-full bg-[#f7c64b] px-7 text-sm font-black text-[#4b3411] shadow-[0_8px_0_#d79d23] transition hover:-translate-y-0.5 disabled:opacity-60">{step === steps.length - 1 ? (saving ? 'Đang tạo hồ sơ...' : 'Nhận gợi ý AI') : 'Tiếp tục'} <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
