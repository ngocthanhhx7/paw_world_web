import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronDown, Edit3, Minus, Plus } from 'lucide-react';

import { petProfileApi } from '@/api/endpoints';
import {
  activityOptions,
  foodTypeOptions,
  initialQuizForm,
  mapProfileToForm,
  normalizeQuizPayload,
  weightGoalOptions,
} from './meowQuizData';

const fallbackCat = '/assets/cat/image 652.png';
const allergyOptions = ['Không có', 'Cá', 'Bò', 'Thỏ', 'Đậu nành', 'Gluten', 'Lúa mì', 'Trứng', 'Ngô (Bắp)', 'Sữa', 'Dị ứng môi trường'];

function Field({ label, children }) {
  return (
    <label className="relative block">
      <span className="absolute -top-2 left-4 bg-[#fffefa] px-1 text-xs font-medium text-[#9a96a4]">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="h-[50px] w-full rounded-[10px] border border-[#cfd5e0] bg-white px-4 text-base font-medium text-[#27232e] outline-none focus:border-[#b9bfff]"
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[50px] w-full appearance-none rounded-[10px] border border-[#cfd5e0] bg-white px-4 text-base font-medium text-[#27232e] outline-none focus:border-[#b9bfff]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7684]" size={18} />
    </div>
  );
}

function WeightControl({ value, onChange }) {
  const current = Number(value || 0);
  const change = (delta) => onChange(Math.max(0.5, Math.round((current + delta) * 10) / 10));
  return (
    <div className="flex h-[50px] items-center justify-between rounded-[10px] border border-[#cfd5e0] bg-white px-4">
      <button type="button" onClick={() => change(-0.1)} className="text-[#a8a6ae]">
        <Minus size={18} />
      </button>
      <span className="font-bold text-[#27232e]">{String(current || 0).replace('.', ',')} kg</span>
      <button type="button" onClick={() => change(0.1)} className="text-[#7a7684]">
        <Plus size={18} />
      </button>
    </div>
  );
}

function AllergyBox({ label, checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        checked
          ? 'flex h-[58px] items-center gap-4 rounded-[10px] border-2 border-[#ff650f] bg-[#fffefa] px-4 text-left text-base font-semibold'
          : 'flex h-[58px] items-center gap-4 rounded-[10px] border border-[#cfd5e0] bg-white px-4 text-left text-base font-semibold'
      }
    >
      <span className={checked ? 'grid h-5 w-5 place-items-center rounded-[4px] bg-[#ff650f] text-xs text-white' : 'h-5 w-5 rounded-[4px] border border-[#cfd5e0]'}>{checked ? '✓' : ''}</span>
      {label}
    </button>
  );
}

export default function PetProfileEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialQuizForm);
  const [saving, setSaving] = useState(false);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    petProfileApi.get(id)
      .then((data) => setForm(mapProfileToForm(data.profile)))
      .catch(() => {
        toast.error('Không tìm thấy hồ sơ');
        navigate('/meow-quizz/ho-so');
      });
  }, [id, navigate]);

  const selectedAllergies = String(form.allergies || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const toggleAllergy = (label) => {
    if (label === 'Không có') {
      update({ noAllergies: true, allergies: '' });
      return;
    }
    const next = selectedAllergies.includes(label)
      ? selectedAllergies.filter((item) => item !== label)
      : [...selectedAllergies, label];
    update({ noAllergies: false, allergies: next.join(', ') });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await petProfileApi.update(id, normalizeQuizPayload(form));
      toast.success('Đã cập nhật hồ sơ');
      navigate('/meow-quizz/ho-so');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chưa cập nhật được hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#fffefa] pb-28 pt-10 text-[#25222b]">
      <div className="pointer-events-none absolute -left-16 top-28 hidden h-[240px] w-[240px] opacity-[0.08] lg:block">
        <img src="/assets/icon/khac/pets.svg" alt="" className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute -right-12 bottom-36 hidden h-[240px] w-[240px] opacity-[0.08] lg:block">
        <img src="/assets/icon/khac/pets.svg" alt="" className="h-full w-full" />
      </div>

      <form onSubmit={save} className="mx-auto max-w-[624px] px-4">
        <h1 className="crayon text-center text-[52px] leading-none text-[#222027]">Chỉnh sửa hồ sơ</h1>

        <div className="relative mx-auto mt-12 h-[126px] w-[126px]">
          <img src={form.photoUrl || fallbackCat} alt={form.name || 'Bé mèo'} className="h-full w-full rounded-full border-4 border-white object-cover shadow-sm" />
          <button type="button" className="absolute left-[-10px] top-0 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#f15916] text-white shadow-md">
            <Edit3 size={16} />
          </button>
        </div>

        <div className="mt-10 space-y-11">
          <Field label="Tên">
            <Input value={form.name} onChange={(event) => update({ name: event.target.value })} />
          </Field>

          <section>
            <h2 className="mb-5 text-[22px] font-extrabold">Thông tin chung</h2>
            <div className="space-y-4">
              <Field label="Giới tính">
                <Select
                  value={form.sex || 'female'}
                  onChange={(value) => update({ sex: value })}
                  options={[
                    { value: 'female', label: 'Cái' },
                    { value: 'male', label: 'Đực' },
                  ]}
                />
              </Field>
              <Field label="Ngày sinh">
                <Input
                  value={`${String(form.ageYears || 0).padStart(2, '0')}/${String(form.ageMonths || 0).padStart(2, '0')}/2026`}
                  onChange={() => undefined}
                  readOnly
                />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-[22px] font-extrabold">Lối sống</h2>
            <div className="space-y-4">
              <Field label="Cân nặng">
                <WeightControl value={form.weightKg || 4.4} onChange={(value) => update({ weightKg: value })} />
              </Field>
              <Field label="Trạng thái cơ thể">
                <Select value={form.weightGoal || 'gain'} onChange={(value) => update({ weightGoal: value })} options={weightGoalOptions} />
              </Field>
              <Field label="Mức độ hoạt động">
                <Select value={form.activityLevel || 'active'} onChange={(value) => update({ activityLevel: value })} options={activityOptions} />
              </Field>
              <Field label="Thức ăn">
                <Select value={form.currentFoodType || 'dry'} onChange={(value) => update({ currentFoodType: value })} options={foodTypeOptions} />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-[22px] font-extrabold">Sức khỏe</h2>
            <p className="mb-4 text-sm font-semibold">Dị ứng và những gì {form.name || 'bé'} thích không ăn:</p>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {allergyOptions.map((label) => (
                <AllergyBox
                  key={label}
                  label={label}
                  checked={label === 'Không có' ? form.noAllergies : selectedAllergies.includes(label)}
                  onClick={() => toggleAllergy(label)}
                />
              ))}
            </div>
          </section>

          <Field label="Vấn đề sức khỏe">
            <Select
              value={form.healthIssues || ''}
              onChange={(value) => update({ healthIssues: value })}
              options={[
                { value: '', label: '' },
                { value: 'Tiêu hóa nhạy cảm', label: 'Tiêu hóa nhạy cảm' },
                { value: 'Da và lông', label: 'Da và lông' },
                { value: 'Xương khớp', label: 'Xương khớp' },
              ]}
            />
          </Field>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#eff1ff] px-4 py-5">
          <div className="mx-auto flex max-w-[624px] items-center justify-center gap-12">
            <button type="button" onClick={() => navigate('/meow-quizz/ho-so')} className="h-14 min-w-[160px] rounded-full text-base font-extrabold">
              Hủy bỏ
            </button>
            <button disabled={saving} className="h-14 min-w-[226px] rounded-full bg-[#ffca2d] text-base font-extrabold disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
