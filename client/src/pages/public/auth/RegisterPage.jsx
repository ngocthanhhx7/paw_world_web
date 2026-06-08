import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import { AuthInput, SocialButtons } from './LoginPage';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useCustomerAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Dang ky thanh cong');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Dang ky that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Dang ky"
      subtitle="Tao tai khoan de luu ho so va goi y dinh duong cho be meo."
      footer={<>Da co tai khoan? <Link className="text-cocoa-700 underline" to="/dang-nhap">Dang nhap</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Ho va ten" value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
        <AuthInput label="Email" type="email" value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} />
        <AuthInput label="Mat khau" type="password" value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} />
        <button disabled={loading} className="w-full rounded-full bg-sun-400 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-cocoa-700 shadow-[0_8px_0_#d9a72d] transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? 'Dang xu ly...' : 'Tao tai khoan'}
        </button>
      </form>
      <SocialButtons />
    </AuthShell>
  );
}
