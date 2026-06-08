import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthShell from './AuthShell';
import { AuthInput, PasswordInput, PrimaryButton, SocialButtons } from './LoginPage';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useCustomerAuthStore((s) => s.register);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirect = params.get('redirect') || '/meow-quizz';

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Dang ky thanh cong');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Dang ky that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Chao mung<br />ban nhe</>}>
      <form onSubmit={submit} className="space-y-4">
        <AuthInput
          label="Ho va ten"
          placeholder="Nguyen Con Sen"
          value={form.fullName}
          onChange={(fullName) => setForm((value) => ({ ...value, fullName }))}
        />
        <AuthInput
          label="Dia chi email"
          type="email"
          placeholder="hello@pawworld.com"
          value={form.email}
          onChange={(email) => setForm((value) => ({ ...value, email }))}
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">
              Mat khau
            </label>
            <Link to="/quen-mat-khau" className="text-[11px] font-extrabold text-[#a95620] underline">
              Quen mat khau?
            </Link>
          </div>
          <PasswordInput
            value={form.password}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            onChange={(password) => setForm((value) => ({ ...value, password }))}
          />
        </div>
        <PrimaryButton loading={loading}>Dang ky</PrimaryButton>
      </form>

      <SocialButtons />

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        Ban da co tai khoan?{' '}
        <Link className="font-extrabold uppercase text-[#a95620] underline" to={`/dang-nhap?redirect=${encodeURIComponent(redirect)}`}>
          Dang nhap
        </Link>
      </p>
    </AuthShell>
  );
}
