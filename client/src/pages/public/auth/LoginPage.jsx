import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

import AuthShell from './AuthShell';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

const socialToast = () => toast('Tinh nang dang phat trien');

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useCustomerAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirect = params.get('redirect') || '/';

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Dang nhap thanh cong');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Dang nhap that bai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Chao mung<br />tro lai</>}>
      <form onSubmit={submit} className="relative space-y-4">
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

        <PrimaryButton loading={loading}>Dang nhap</PrimaryButton>
      </form>

      <SocialButtons />

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        Ban chua co tai khoan?{' '}
        <Link className="font-extrabold uppercase text-[#a95620] underline" to={`/dang-ky?redirect=${encodeURIComponent(redirect)}`}>
          Dang ky
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthInput({ label, onChange, className = '', ...props }) {
  return (
    <label className="block text-left text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">
      {label}
      <input
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 h-12 w-full rounded-[10px] border-0 bg-[#dff2e9] px-4 text-sm font-semibold text-[#252020] outline-none placeholder:text-[#9fb6aa] focus:bg-[#d8eee4] ${className}`}
      />
    </label>
  );
}

export function PasswordInput({ value, show, onToggle, onChange, placeholder = '' }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[10px] border-0 bg-[#dff2e9] px-4 pr-12 text-sm font-semibold text-[#252020] outline-none placeholder:text-[#9fb6aa] focus:bg-[#d8eee4]"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#252020]"
        aria-label={show ? 'An mat khau' : 'Hien mat khau'}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function PrimaryButton({ loading, children }) {
  return (
    <button
      disabled={loading}
      className="mt-3 h-12 w-full rounded-full bg-[#ffcb2e] text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#252020] transition hover:bg-[#ffb800] disabled:opacity-60"
    >
      {loading ? 'Dang xu ly...' : children}
    </button>
  );
}

export function SocialButtons() {
  return (
    <div className="mt-7">
      <div className="flex items-center gap-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#252020]">
        <span className="h-px flex-1 bg-[#252020]" />
        Tiep tuc voi
        <span className="h-px flex-1 bg-[#252020]" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={socialToast}
          className="flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#252020] bg-white text-[10px] font-extrabold uppercase text-[#252020]"
        >
          <span className="h-3 w-3 rounded-[2px] bg-[#f4dfd7]" />
          Google
        </button>
        <button
          type="button"
          onClick={socialToast}
          className="flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#252020] bg-white text-[10px] font-extrabold uppercase text-[#252020]"
        >
          <span className="grid h-4 w-4 place-items-center rounded-full bg-[#edf2ff] text-[10px] font-black text-[#2861d8]">f</span>
          Facebook
        </button>
      </div>
    </div>
  );
}
