import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

import AuthShell from './AuthShell';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

const socialToast = () => toast('Tính năng đang phát triển');

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
      toast.success('Đăng nhập thành công');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Chào mừng<br />trở lại</>} subtitle="Đăng nhập để lưu hồ sơ mèo, xem gợi ý AI và tiếp tục đơn hàng của bạn.">
      <form onSubmit={submit} className="relative space-y-4">
        <AuthInput label="Địa chỉ email" type="email" placeholder="hello@pawworld.com" value={form.email} onChange={(email) => setForm((value) => ({ ...value, email }))} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">Mật khẩu</label>
            <Link to="/quen-mat-khau" className="text-[11px] font-extrabold text-[#a95620] underline">Quên mật khẩu?</Link>
          </div>
          <PasswordInput value={form.password} show={showPassword} onToggle={() => setShowPassword((value) => !value)} onChange={(password) => setForm((value) => ({ ...value, password }))} />
        </div>

        <PrimaryButton loading={loading}>Đăng nhập</PrimaryButton>
      </form>

      <SocialButtons />

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        Bạn chưa có tài khoản?{' '}
        <Link className="font-extrabold uppercase text-[#a95620] underline" to={`/dang-ky?redirect=${encodeURIComponent(redirect)}`}>Đăng ký</Link>
      </p>
    </AuthShell>
  );
}

export function AuthInput({ label, onChange, className = '', ...props }) {
  return (
    <label className="block text-left text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">
      {label}
      <input {...props} onChange={(event) => onChange(event.target.value)} className={`mt-2 h-12 w-full rounded-[10px] border-0 bg-[#dff2e9] px-4 text-sm font-semibold text-[#252020] outline-none placeholder:text-[#9fb6aa] focus:bg-[#d8eee4] ${className}`} />
    </label>
  );
}

export function PasswordInput({ value, show, onToggle, onChange, placeholder = '' }) {
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[10px] border-0 bg-[#dff2e9] px-4 pr-12 text-sm font-semibold text-[#252020] outline-none placeholder:text-[#9fb6aa] focus:bg-[#d8eee4]" />
      <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#252020]" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function PrimaryButton({ loading, children }) {
  return (
    <button disabled={loading} className="mt-3 h-12 w-full rounded-full bg-[#ffcb2e] text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#252020] transition hover:bg-[#ffb800] disabled:opacity-60">
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
}

export function SocialButtons() {
  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={socialToast} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#e2d6c8] bg-white text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#252020] transition hover:bg-[#fff8f0]">
        <img src="/assets/icon/khac/ic_baseline-facebook.svg" alt="" className="h-5 w-5" />
        Tiếp tục với Facebook
      </button>
      <button type="button" onClick={socialToast} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#e2d6c8] bg-white text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#252020] transition hover:bg-[#fff8f0]">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f5f5f5] text-[13px] font-black text-[#4285f4]">G</span>
        Tiếp tục với Google
      </button>
    </div>
  );
}
