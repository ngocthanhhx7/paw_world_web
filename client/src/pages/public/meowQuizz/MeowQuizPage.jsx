import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  ArrowLeft,
  Bone,
  CloudUpload,
  Fish,
  HeartPulse,
  Minus,
  PawPrint,
  Plus,
  Scale,
  ShieldPlus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';

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
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

const visualSteps = [
  {
    key: 'name',
    title: 'Tên bé mèo của bạn là gì?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'age',
    title: 'Bé Pun bao nhiêu tuổi?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'weight',
    title: 'Bé Pun bao nhiêu cân?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'allergies',
    title: 'Bé Pun có dị ứng với món ăn không?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'healthGoals',
    title: 'Sen có mục tiêu về sức khỏe cho bé không?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'activity',
    title: 'Bé Pun có hoạt động thường xuyên không?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'weightGoal',
    title: 'Mục tiêu cân nặng của bé là?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'foodType',
    title: 'Hiện tại sen đang cho bé ăn là?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'flavors',
    title: 'Vị ưa thích của bé Pun là gì nè?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
  {
    key: 'photo',
    title: 'Vị ưa thích của bé Pun là gì nè?',
    description: 'Hãy chia sẻ một chút về người bạn bốn chân của bạn để chúng mình bắt đầu cá nhân hóa thực đơn nhé.',
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function catName(form) {
  return form.name?.trim() || 'Pun';
}

function titleFor(step, form) {
  return step.title.replaceAll('Pun', catName(form));
}

function QuizFrame({ children }) {
  return (
    <section className="meow-quiz-bg relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#f3ddff] px-5 py-[86px] max-sm:px-4 max-sm:py-16">
      <div className="pointer-events-none absolute left-[-18px] top-[112px] hidden h-[252px] w-[252px] -rotate-[26deg] opacity-30 lg:block">
        <PawPrint className="h-full w-full fill-[#cdb6df] text-[#cdb6df]" strokeWidth={0.4} />
      </div>
      <div className="pointer-events-none absolute right-[-28px] bottom-[72px] hidden h-[172px] w-[172px] rotate-[28deg] opacity-30 lg:block">
        <PawPrint className="h-full w-full fill-[#cdb6df] text-[#cdb6df]" strokeWidth={0.4} />
      </div>
      <div className="relative z-10 mx-auto w-[calc(100vw-32px)] min-w-0 max-w-[602px] sm:w-full">{children}</div>
    </section>
  );
}

function StepBadge({ step, onBack }) {
  return (
    <div className="mb-7 flex justify-center">
      <button type="button" onClick={onBack} className="mr-2 text-[#1f1d27]" aria-label="Quay lại">
        <ArrowLeft size={17} />
      </button>
      <span className="rounded-full bg-[#e3d5ff] px-4 py-2 text-sm font-semibold text-[#663cff]">
        Bước {step + 1} trên 10
      </span>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-8 h-[58px] w-full min-w-0 rounded-full bg-[#ffca2d] px-4 text-lg font-semibold text-[#5a5261] transition hover:bg-[#ffc11d] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </button>
  );
}

function TextField({ label, className, name, ...props }) {
  const fieldName = name || label || props.placeholder || 'meow-field';
  return (
    <label className={cx('block text-left text-sm font-semibold text-[#4c4658]', className)}>
      {label ? <span className="mb-2 block">{label}</span> : null}
      <input
        {...props}
        name={fieldName}
        className="h-[56px] w-full rounded-2xl border border-transparent bg-[#f1eff8] px-5 text-base font-medium text-[#363140] outline-none placeholder:text-[#c8c3d7] focus:border-[#b6b9ff] focus:bg-[#fffdf3]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder, name }) {
  return (
    <label className="block text-left text-sm font-semibold text-[#4c4658]">
      <span className="mb-2 block">{label}</span>
      <select
        name={name || label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[56px] w-full appearance-none rounded-2xl border border-transparent bg-[#f1eff8] px-5 text-base font-medium text-[#363140] outline-none focus:border-[#b6b9ff] focus:bg-[#fffdf3]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceButton({ selected, children, icon, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-h-[80px] w-full min-w-0 items-center gap-4 rounded-[10px] px-7 text-left text-lg font-semibold transition max-sm:px-4',
        selected ? 'border-2 border-[#b9bfff] bg-[#fffdf3]' : 'border-2 border-transparent bg-[#f0eff8]',
        className,
      )}
    >
      {icon ? <span className="shrink-0 text-[#a98dff]">{icon}</span> : null}
      <span className="min-w-0 break-words">{children}</span>
    </button>
  );
}

function SquareChoice({ selected, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'grid h-[150px] place-items-center rounded-[14px] text-center transition',
        selected ? 'border-2 border-[#b9bfff] bg-[#fffdf3]' : 'border-2 border-transparent bg-[#f0eff8]',
      )}
    >
      <span className={cx('grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm', selected && 'bg-[#c7c9ff]')}>
        {icon}
      </span>
      <span className="text-2xl font-semibold text-[#4c4958]">{label}</span>
    </button>
  );
}

function StepCard({ step, form, onBack, onNext, nextDisabled, children, saving }) {
  return (
    <div className="meow-quiz-card w-full min-w-0 rounded-[30px] bg-white px-12 py-12 max-sm:px-4">
      <StepBadge step={step} onBack={onBack} />
      <h1 className="crayon break-words text-center text-[30px] leading-tight text-[#25232b] max-sm:text-[27px]">{titleFor(visualSteps[step], form)}</h1>
      <p className="mx-auto mt-5 max-w-[510px] break-words text-center text-base leading-6 text-[#5f5968]">
        {visualSteps[step].description}
      </p>
      <div className="mt-10">{children}</div>
      <PrimaryButton disabled={nextDisabled || saving} onClick={onNext}>
        {saving ? 'Đang lưu...' : 'Tiếp theo'}
      </PrimaryButton>
    </div>
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
      if (resumeStep) setStep(Math.min(Number(resumeStep) || 0, visualSteps.length - 1));
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(RESUME_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resume') === '1') toast.success('Đã quay lại Meow Quizz');
  }, [location.search]);

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
    const key = visualSteps[step].key;
    if (key === 'name') return form.name.trim().length >= 2 && Boolean(form.sex);
    if (key === 'age') return Number(form.ageYears || 0) > 0 || Number(form.ageMonths || 0) > 0;
    if (key === 'weight') return Number(form.weightKg || 0) > 0;
    if (key === 'healthGoals') return form.healthGoals.length > 0;
    if (key === 'activity') return Boolean(form.activityLevel);
    if (key === 'weightGoal') return Boolean(form.weightGoal);
    if (key === 'foodType') return Boolean(form.currentFoodType);
    return true;
  };

  const validationMessage = () => {
    const key = visualSteps[step].key;
    if (key === 'name') return 'Nhập tên và chọn giới tính của bé nha';
    if (key === 'age') return 'Chọn tuổi của bé nha';
    if (key === 'weight') return 'Nhập cân nặng hợp lệ nha';
    if (key === 'healthGoals') return 'Chọn ít nhất một mục tiêu nha';
    if (key === 'activity') return 'Chọn mức hoạt động nha';
    if (key === 'weightGoal') return 'Chọn mục tiêu cân nặng nha';
    if (key === 'foodType') return 'Chọn loại thức ăn hiện tại nha';
    return 'Sen điền thêm thông tin để tiếp tục nhé';
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error(`Ảnh tối đa ${MAX_PHOTO_SIZE_MB}MB`);
      return;
    }
    if (!customer) {
      update({ photoUrl: '' });
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const data = await petProfileApi.uploadPhoto(formData);
      update({ photoUrl: data.photoUrl });
    } catch {
      toast.error('Chưa tải được ảnh, sen thử lại sau nha');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async () => {
    if (!canContinue()) {
      toast.error(validationMessage());
      return;
    }
    if (step < visualSteps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    if (!authReady) return;
    if (!customer) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      sessionStorage.setItem(RESUME_KEY, String(step));
      navigate('/dang-nhap?redirect=' + encodeURIComponent('/meow-quizz?resume=1'));
      return;
    }
    setSaving(true);
    try {
      await petProfileApi.create(normalizeQuizPayload(form));
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(RESUME_KEY);
      toast.success('Đã tạo hồ sơ cho bé');
      navigate('/meow-quizz/ho-so');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chưa lưu được hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step === 0) {
      navigate('/');
      return;
    }
    setStep((value) => value - 1);
  };

  const renderStep = () => {
    const key = visualSteps[step].key;

    if (key === 'name') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <ChoiceButton
              selected={form.sex === 'male'}
              onClick={() => update({ sex: 'male' })}
              icon={<PawPrint size={22} />}
              className="h-[68px] min-h-0 justify-center whitespace-nowrap px-4 text-base max-sm:whitespace-normal"
            >
              Tên cậu bé mèo là...
            </ChoiceButton>
            <ChoiceButton
              selected={form.sex === 'female'}
              onClick={() => update({ sex: 'female' })}
              icon={<HeartPulse size={22} />}
              className="h-[68px] min-h-0 justify-center whitespace-nowrap px-4 text-base max-sm:whitespace-normal"
            >
              Tên cô bé mèo là...
            </ChoiceButton>
          </div>
          <TextField value={form.name} onChange={(event) => update({ name: event.target.value })} placeholder="nhập tên bé mèo của bạn" autoFocus />
        </div>
      );
    }

    if (key === 'age') {
      const years = Array.from({ length: 21 }, (_, index) => ({ value: String(index), label: index ? `${index} tuổi` : 'Năm' }));
      const months = Array.from({ length: 12 }, (_, index) => ({ value: String(index), label: index ? `${index} tháng` : 'Tháng' }));
      return (
        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <SelectField label="Năm" value={String(form.ageYears ?? '')} onChange={(value) => update({ ageYears: value })} options={years.slice(1)} placeholder="Năm" />
          <SelectField label="Tháng" value={String(form.ageMonths ?? '')} onChange={(value) => update({ ageMonths: value })} options={months.slice(1)} placeholder="Tháng" />
        </div>
      );
    }

    if (key === 'weight') {
      const currentWeight = Number(form.weightKg || 4.5);
      const changeWeight = (delta) => update({ weightKg: Math.max(0.5, Math.round((currentWeight + delta) * 10) / 10) });
      return (
        <div className="weight-stepper flex h-[124px] items-center justify-between rounded-[14px] bg-[#f0eff8] px-8">
          <button type="button" onClick={() => changeWeight(-0.1)} className="grid h-12 w-12 place-items-center rounded-full bg-[#dddde5]">
            <Minus size={22} />
          </button>
          <div className="text-center text-[#6b43ee]">
            <span className="text-5xl font-extrabold">{currentWeight.toFixed(1)}</span>
            <span className="ml-3 text-2xl font-bold text-[#a98dff]">KG</span>
          </div>
          <button type="button" onClick={() => changeWeight(0.1)} className="grid h-12 w-12 place-items-center rounded-full bg-[#dddde5]">
            <Plus size={22} />
          </button>
        </div>
      );
    }

    if (key === 'allergies') {
      return (
        <div className="space-y-10">
          <TextField
            label="Nhập thành phần cụ thể (nếu có)"
            value={form.allergies}
            disabled={form.noAllergies}
            onChange={(event) => update({ allergies: event.target.value, noAllergies: false })}
            placeholder="Ví dụ: Tôm, Cua, Cà rốt..."
          />
          <button
            type="button"
            onClick={() => update({ noAllergies: !form.noAllergies, allergies: form.noAllergies ? form.allergies : '' })}
            className="flex h-[58px] w-full items-center justify-between rounded-2xl bg-[#f0eff8] px-5 text-left text-base font-medium"
          >
            Bé không có dị ứng
            <span className={cx('relative h-6 w-11 rounded-full transition', form.noAllergies ? 'bg-[#b7baf5]' : 'bg-[#b9b7ca]')}>
              <span className={cx('absolute top-1 h-4 w-4 rounded-full bg-white transition', form.noAllergies ? 'left-6 bg-[#ffc62d]' : 'left-1')} />
            </span>
          </button>
        </div>
      );
    }

    if (key === 'healthGoals') {
      const icons = {
        bone: <Bone size={28} />,
        skin_coat: <PawPrint size={30} />,
        teeth: <Sparkles size={28} />,
        digestion: <ShieldPlus size={28} />,
      };
      return (
        <div className="grid grid-cols-2 gap-4">
          {healthGoalOptions.map((option) => (
            <SquareChoice key={option.value} selected={form.healthGoals.includes(option.value)} label={option.label} icon={icons[option.value]} onClick={() => toggleGoal(option.value)} />
          ))}
        </div>
      );
    }

    if (key === 'activity') {
      const icons = { low: <Activity size={24} />, active: <PawPrint size={24} />, very_active: <Zap size={24} /> };
      return (
        <div className="space-y-4">
          {activityOptions.map((option) => (
            <ChoiceButton key={option.value} selected={form.activityLevel === option.value} onClick={() => update({ activityLevel: option.value })} icon={icons[option.value]}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      );
    }

    if (key === 'weightGoal') {
      const icons = { gain: <TrendingUp size={24} />, maintain: <Scale size={24} />, lose: <TrendingDown size={24} /> };
      return (
        <div className="space-y-4">
          {weightGoalOptions.map((option) => (
            <ChoiceButton key={option.value} selected={form.weightGoal === option.value} onClick={() => update({ weightGoal: option.value })} icon={icons[option.value]}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      );
    }

    if (key === 'foodType') {
      const icons = { dry: <Waves size={24} />, wet: <Fish size={24} />, mixed: <Sparkles size={24} /> };
      return (
        <div className="space-y-4">
          {foodTypeOptions.map((option) => (
            <ChoiceButton key={option.value} selected={form.currentFoodType === option.value} onClick={() => update({ currentFoodType: option.value })} icon={icons[option.value]}>
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      );
    }

    if (key === 'flavors') {
      return (
        <TextField
          label="Vị đó là gì"
          value={form.favoriteFlavors}
          onChange={(event) => update({ favoriteFlavors: event.target.value })}
          placeholder="Ví dụ: Thịt gà, thịt bò, thịt lợn..."
        />
      );
    }

    return (
      <label className="upload-dropzone grid h-[234px] cursor-pointer place-items-center rounded-[18px] border-4 border-dashed border-[#7d5bff] text-center">
        <input type="file" accept="image/*" className="sr-only" disabled={uploadingPhoto} onChange={(event) => uploadPhoto(event.target.files?.[0])} />
        <span>
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-[#7d5bff] text-[#6b43ee]">
            <CloudUpload size={34} />
          </span>
          <span className="mt-4 block text-sm font-bold text-[#6b43ee]">
            {uploadingPhoto ? 'Đang tải ảnh...' : form.photoUrl ? 'Đã tải ảnh lên' : 'Tải ảnh lên hoặc kéo thả'}
          </span>
          <span className="mt-1 block text-xs font-semibold text-[#9b96a8]">Tối đa {MAX_PHOTO_SIZE_MB}MB</span>
        </span>
      </label>
    );
  };

  return (
    <QuizFrame>
      <StepCard step={step} form={form} onBack={goBack} onNext={submit} nextDisabled={!canContinue()} saving={saving}>
        {renderStep()}
      </StepCard>
    </QuizFrame>
  );
}
