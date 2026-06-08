import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { petProfileApi } from '@/api/endpoints';
import { activityOptions, foodTypeOptions, healthGoalOptions, initialQuizForm, normalizeQuizPayload, weightGoalOptions } from './meowQuizData';

function Input(props) {
  return <input {...props} className="h-13 w-full rounded-[16px] border border-[#eadff8] px-4 text-sm font-semibold outline-none focus:border-[#c69bed]" />;
}

export default function PetProfileEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialQuizForm);
  const [saving, setSaving] = useState(false);
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    petProfileApi.get(id).then((data) => {
      const profile = data.profile;
      setForm({
        ...initialQuizForm,
        ...profile,
        allergies: (profile.allergies || []).join(', '),
        healthIssues: (profile.healthIssues || []).join(', '),
        favoriteFlavors: (profile.favoriteFlavors || []).join(', '),
      });
    }).catch(() => {
      toast.error('Khong tim thay ho so');
      navigate('/meow-quizz/ho-so');
    });
  }, [id, navigate]);

  const toggleGoal = (value) => update({ healthGoals: form.healthGoals.includes(value) ? form.healthGoals.filter((item) => item !== value) : [...form.healthGoals, value] });
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await petProfileApi.update(id, normalizeQuizPayload(form));
      toast.success('Da cap nhat ho so');
      navigate('/meow-quizz/ho-so');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Chua cap nhat duoc ho so');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-[#f4e9ff] px-4 py-10 text-[#4b3a62]">
      <form onSubmit={save} className="mx-auto max-w-4xl rounded-[32px] bg-white p-6 shadow-[0_18px_0_rgba(94,62,130,0.08)] sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d29a28]">Ho so thu cung</p>
        <h1 className="mt-2 text-4xl font-black text-[#4d2b63]">Chinh sua thong tin</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-bold">Ten be<Input value={form.name} onChange={(e) => update({ name: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold">Giong meo<Input value={form.breed} onChange={(e) => update({ breed: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold">Nam tuoi<Input type="number" min="0" value={form.ageYears} onChange={(e) => update({ ageYears: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold">Thang<Input type="number" min="0" max="11" value={form.ageMonths} onChange={(e) => update({ ageMonths: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold">Can nang<Input type="number" min="0" step="0.1" value={form.weightKg} onChange={(e) => update({ weightKg: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold">Di ung<Input value={form.allergies} onChange={(e) => update({ allergies: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold md:col-span-2">Van de suc khoe<Input value={form.healthIssues} onChange={(e) => update({ healthIssues: e.target.value })} /></label>
          <label className="space-y-2 text-sm font-bold md:col-span-2">Vi ua thich<Input value={form.favoriteFlavors} onChange={(e) => update({ favoriteFlavors: e.target.value })} /></label>
        </div>
        <div className="mt-7 space-y-4">
          <p className="text-sm font-black text-[#4d2b63]">Muc tieu suc khoe</p>
          <div className="grid gap-3 sm:grid-cols-4">{healthGoalOptions.map((option) => <button type="button" key={option.value} onClick={() => toggleGoal(option.value)} className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${form.healthGoals.includes(option.value) ? 'border-[#f0b83c] bg-[#fff2c7]' : 'border-[#eadff8] bg-white'}`}>{option.label}</button>)}</div>
          <div className="grid gap-3 sm:grid-cols-3">{activityOptions.map((option) => <button type="button" key={option.value} onClick={() => update({ activityLevel: option.value })} className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${form.activityLevel === option.value ? 'border-[#f0b83c] bg-[#fff2c7]' : 'border-[#eadff8] bg-white'}`}>{option.label}</button>)}</div>
          <div className="grid gap-3 sm:grid-cols-3">{weightGoalOptions.map((option) => <button type="button" key={option.value} onClick={() => update({ weightGoal: option.value })} className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${form.weightGoal === option.value ? 'border-[#f0b83c] bg-[#fff2c7]' : 'border-[#eadff8] bg-white'}`}>{option.label}</button>)}</div>
          <div className="grid gap-3 sm:grid-cols-3">{foodTypeOptions.map((option) => <button type="button" key={option.value} onClick={() => update({ currentFoodType: option.value })} className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${form.currentFoodType === option.value ? 'border-[#f0b83c] bg-[#fff2c7]' : 'border-[#eadff8] bg-white'}`}>{option.label}</button>)}</div>
        </div>
        <div className="mt-8 flex justify-end gap-3"><button type="button" onClick={() => navigate('/meow-quizz/ho-so')} className="rounded-full bg-[#f7f1ff] px-6 py-3 text-sm font-bold text-[#6d4b8d]">Huy</button><button disabled={saving} className="rounded-full bg-[#f7c64b] px-6 py-3 text-sm font-black text-[#4b3411] shadow-[0_7px_0_#d79d23]">{saving ? 'Dang luu...' : 'Luu ho so'}</button></div>
      </form>
    </section>
  );
}
