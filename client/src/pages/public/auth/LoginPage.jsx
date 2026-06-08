import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

const socialToast = () => toast('Tinh nang dang phat trien');

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useCustomerAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Dang nhap thanh cong');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Dang nhap that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Dang nhap"
      subtitle="Tro lai PawWorld de tiep tuc cham soc be meo cua ban."
      footer={<>Chua co tai khoan? <Link className="text-cocoa-700 underline" to="/dang-ky">Dang ky</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Email" type="email" value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} />
        <AuthInput label="Mat khau" type="password" value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} />
        <div className="text-right text-sm font-bold">
          <Link to="/quen-mat-khau" className="text-cocoa-500 underline">Quen mat khau?</Link>
        </div>
        <button disabled={loading} className="w-full rounded-full bg-sun-400 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-cocoa-700 shadow-[0_8px_0_#d9a72d] transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? 'Dang xu ly...' : 'Dang nhap'}
        </button>
      </form>
      <SocialButtons />
    </AuthShell>
  );
}

export function AuthInput({ label, onChange, ...props }) {
  return (
    <label className="block text-left text-sm font-extrabold text-cocoa-500">
      {label}
      <input
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-lavender-100 bg-lavender-50 px-4 py-3 text-base font-semibold text-cocoa-600 outline-none transition focus:border-lavender-300 focus:bg-white"
      />
    </label>
  );
}

export function SocialButtons() {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-cocoa-300">
        <span className="h-px flex-1 bg-lavender-100" /> hoac <span className="h-px flex-1 bg-lavender-100" />
      </div>
      <button type="button" onClick={socialToast} className="flex w-full items-center justify-center gap-3 rounded-full border border-lavender-100 bg-white px-4 py-3 text-sm font-extrabold text-cocoa-600 shadow-sm">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-lg font-black text-[#4285f4]">G</span> Tiep tuc voi Google
      </button>
      <button type="button" onClick={socialToast} className="flex w-full items-center justify-center gap-3 rounded-full border border-lavender-100 bg-[#1877f2] px-4 py-3 text-sm font-extrabold text-white shadow-sm">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white font-black text-[#1877f2]">f</span> Tiep tuc voi Facebook
      </button>
    </div>
  );
}
