import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Camera, Check, Sparkles } from 'lucide-react';

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

const steps = [
  { key: 'name', title: 'Ten cua be meo?', hint: 'Moi sen dien ten than mat de AI tao ho so rieng cho be.' },
  { key: 'sex', title: 'Be la mot...', hint: 'Thong tin nay giup loi khuyen duoc ca nhan hoa hon.' },
  { key: 'age', title: 'Be bao nhieu tuoi ne?', hint: 'Tuoi tac anh huong truc tiep toi nang luong va che do an.' },
  { key: 'breed', title: 'Be thuoc giong meo gi nhi?', hint: 'Neu khong chac, sen co the nhap meo ta hoac chua ro.' },
  { key: 'weight', title: 'Hien tai be nang bao nhieu kg?', hint: 'Can nang giup uoc tinh calo moi ngay chinh xac hon.' },
  { key: 'allergies', title: 'Be co di ung voi mon an gi khong sen?', hint: 'AI se tranh cac thanh phan khong phu hop.' },
  { key: 'health', title: 'Be co van de suc khoe nao khong ne?', hint: 'Ghi ngan gon cac tinh trang dang quan tam.' },
  { key: 'goals', title: 'Sen dang co muc tieu suc khoe nao cho be?', hint: 'Co the chon nhieu muc tieu cung luc.' },
  { key: 'activity', title: 'Be co thuong xuyen hoat dong khong ne?', hint: 'Muc do van dong se dieu chinh khau phan phu hop.' },
  { key: 'food', title: 'Khau vi va bua an hien tai cua be?', hint: 'Buoc cuoi de AI tao meal kit va combo san pham.' },
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

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      setForm({ ...initialQuizForm, ...JSON.parse(raw) });
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resume') === '1') toast.success('Da quay lai Meow Quizz');
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
    return true;
  };

  const submit = async () => {
    if (!canContinue()) {
      toast.error('Sen dien them thong tin de tiep tuc nhe');
      return;
    }
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    if (!authReady) return;
    if (!customer) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      navigate('/dang-nhap?redirect=/meow-quizz?resume=1');
      return;
    }
    setSaving(true);
    try {
      const data = await petProfileApi.create(normalizeQuizPayload(form));
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success('Da tao ho so cho be');
      navigate(`/meow-quizz/ket-qua/${data.profile._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chua luu duoc ho so');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (current.key === 'name') return <TextInput value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Vi du: Mochi" autoFocus />;
    if (current.key === 'sex') {
      return <div className="grid gap-4 sm:grid-cols-2"><OptionButton selected={form.sex === 'female'} onClick={() => update({ sex: 'female' })}>Co be ngoan</OptionButton><OptionButton selected={form.sex === 'male'} onClick={() => update({ sex: 'male' })}>Chu be ngoan</OptionButton></div>;
    }
    if (current.key === 'age') return <div className="grid gap-4 sm:grid-cols-2"><TextInput type="number" min="0" value={form.ageYears} onChange={(e) => update({ ageYears: e.target.value })} placeholder="Nam" /><TextInput type="number" min="0" max="11" value={form.ageMonths} onChange={(e) => update({ ageMonths: e.target.value })} placeholder="Thang" /></div>;
    if (current.key === 'breed') return <TextInput value={form.breed} onChange={(e) => update({ breed: e.target.value })} placeholder="Vi du: Meo Anh long ngan" />;
    if (current.key === 'weight') return <TextInput type="number" min="0" step="0.1" value={form.weightKg} onChange={(e) => update({ weightKg: e.target.value })} placeholder="Vi du: 4.2" />;
    if (current.key === 'allergies') return <div className="space-y-4"><OptionButton selected={form.noAllergies} onClick={() => update({ noAllergies: !form.noAllergies, allergies: '' })}>Be khong co di ung</OptionButton><TextInput disabled={form.noAllergies} value={form.allergies} onChange={(e) => update({ allergies: e.target.value, noAllergies: false })} placeholder="Nhap cac mon, cach nhau bang dau phay" /></div>;
    if (current.key === 'health') return <TextInput value={form.healthIssues} onChange={(e) => update({ healthIssues: e.target.value })} placeholder="Vi du: long rung, tieu hoa kem" />;
    if (current.key === 'goals') return <div className="grid gap-4 sm:grid-cols-2">{healthGoalOptions.map((option) => <OptionButton key={option.value} selected={form.healthGoals.includes(option.value)} onClick={() => toggleGoal(option.value)}><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7eaff] text-[#8c5bc4]">{option.icon}</span>{option.label}</span></OptionButton>)}</div>;
    if (current.key === 'activity') return <div className="grid gap-4">{activityOptions.map((option) => <OptionButton key={option.value} selected={form.activityLevel === option.value} onClick={() => update({ activityLevel: option.value })}>{option.label}</OptionButton>)}</div>;
    return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3">{weightGoalOptions.map((option) => <OptionButton key={option.value} selected={form.weightGoal === option.value} onClick={() => update({ weightGoal: option.value })}>{option.label}</OptionButton>)}</div><div className="grid gap-4 sm:grid-cols-3">{foodTypeOptions.map((option) => <OptionButton key={option.value} selected={form.currentFoodType === option.value} onClick={() => update({ currentFoodType: option.value })}>{option.label}</OptionButton>)}</div><TextInput value={form.favoriteFlavors} onChange={(e) => update({ favoriteFlavors: e.target.value })} placeholder="Vi ua thich: ga, ca ngu, bo..." /><button type="button" onClick={() => toast('Tinh nang dang phat trien')} className="flex h-14 w-full items-center justify-center gap-3 rounded-[18px] border border-dashed border-[#d8c2ed] bg-[#fbf7ff] text-sm font-bold text-[#765a94]"><Camera size={18} /> Chia se hinh anh cua be</button></div>;
  };

  return (
    <section className="relative overflow-hidden bg-[#f4e9ff] px-4 py-8 text-[#4b3a62] sm:py-12">
      <div className="pointer-events-none absolute left-8 top-24 text-6xl text-white/50">paw</div>
      <div className="pointer-events-none absolute bottom-16 right-10 text-7xl text-white/60">paw</div>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-[26px] bg-white px-5 py-4 shadow-[0_14px_0_rgba(94,62,130,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <button type="button" onClick={() => navigate('/')} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f1ff] text-[#6d4b8d]"><ArrowLeft size={20} /></button>
            <div className="flex-1"><div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#9a7bb9]"><span>Meow Quizz</span><span>Buoc {step + 1} tren {steps.length}</span></div><div className="h-3 overflow-hidden rounded-full bg-[#f1e6fb]"><div className="h-full rounded-full bg-[#f7c64b] transition-all" style={{ width: `${progress}%` }} /></div></div>
            <Sparkles className="text-[#f0b83c]" size={26} />
          </div>
        </div>
        <div className="rounded-[34px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-10">
          <div className="mb-8 text-center"><p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#d29a28]">Ho so thu cung</p><h1 className="text-3xl font-black text-[#4d2b63] sm:text-5xl">{current.title}</h1><p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-[#8b7a9f]">{current.hint}</p></div>
          <div className="mx-auto max-w-2xl">{renderStep()}</div>
          <div className="mt-10 flex items-center justify-between gap-4"><button type="button" disabled={step === 0 || saving} onClick={() => setStep((value) => value - 1)} className="flex h-13 items-center gap-2 rounded-full px-5 text-sm font-bold text-[#7c6795] disabled:opacity-40"><ArrowLeft size={18} /> Quay lai</button><button type="button" disabled={saving} onClick={submit} className="flex h-14 items-center gap-2 rounded-full bg-[#f7c64b] px-7 text-sm font-black text-[#4b3411] shadow-[0_8px_0_#d79d23] transition hover:-translate-y-0.5 disabled:opacity-60">{step === steps.length - 1 ? (saving ? 'Dang tao ho so...' : 'Nhan goi y AI') : 'Tiep tuc'} <ArrowRight size={18} /></button></div>
        </div>
      </div>
    </section>
  );
}
