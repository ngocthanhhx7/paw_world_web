import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

import AuthShell from './AuthShell';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
let googleScriptPromise;
let facebookScriptPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function loadFacebookSdk() {
  if (window.FB) return Promise.resolve();
  if (facebookScriptPromise) return facebookScriptPromise;

  facebookScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://connect.facebook.net/vi_VN/sdk.js"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    window.fbAsyncInit = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return facebookScriptPromise;
}

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

      <SocialButtons onGoogleSuccess={() => navigate(redirect, { replace: true })} />

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

export function SocialButtons({ onGoogleSuccess }) {
  const googleButtonRef = useRef(null);
  const onGoogleSuccessRef = useRef(onGoogleSuccess);
  const googleLogin = useCustomerAuthStore((s) => s.googleLogin);
  const facebookLogin = useCustomerAuthStore((s) => s.facebookLogin);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  useEffect(() => {
    onGoogleSuccessRef.current = onGoogleSuccess;
  }, [onGoogleSuccess]);

  useEffect(() => {
    let cancelled = false;

    if (!googleClientId) return undefined;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response?.credential) {
              toast.error('Dang nhap Google khong hop le');
              return;
            }

            setGoogleLoading(true);
            try {
              await googleLogin(response.credential);
              toast.success('Đăng nhập thành công');
              onGoogleSuccessRef.current?.();
            } catch (err) {
              toast.error(err?.response?.data?.message || 'Đăng nhập Google thất bại');
            } finally {
              setGoogleLoading(false);
            }
          },
        });

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: Math.max(240, Math.floor(googleButtonRef.current.getBoundingClientRect().width || 320)),
          locale: 'vi',
        });
        setGoogleReady(true);
      })
      .catch(() => {
        if (!cancelled) toast.error('Khong tai duoc Google Login');
      });

    return () => {
      cancelled = true;
    };
  }, [googleLogin]);

  useEffect(() => {
    let cancelled = false;

    if (!facebookAppId) return undefined;

    loadFacebookSdk()
      .then(() => {
        if (cancelled || !window.FB) return;
        window.FB.init({
          appId: facebookAppId,
          cookie: false,
          xfbml: false,
          version: 'v20.0',
        });
        setFacebookReady(true);
      })
      .catch(() => {
        if (!cancelled) toast.error('Khong tai duoc Facebook Login');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFacebookLogin = () => {
    if (!facebookAppId) {
      toast.error('Facebook Login chua duoc cau hinh');
      return;
    }
    if (!facebookReady || !window.FB) {
      toast.error('Facebook Login chua san sang');
      return;
    }

    setFacebookLoading(true);
    window.FB.login(
      async (response) => {
        if (!response?.authResponse?.accessToken) {
          setFacebookLoading(false);
          toast.error('Dang nhap Facebook khong hop le');
          return;
        }

        try {
          await facebookLogin(response.authResponse.accessToken);
          toast.success('Đăng nhập thành công');
          onGoogleSuccessRef.current?.();
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Đăng nhập Facebook thất bại');
        } finally {
          setFacebookLoading(false);
        }
      },
      { scope: 'public_profile,email' },
    );
  };

  return (
    <div className="mt-6 space-y-3">
      <button type="button" onClick={handleFacebookLogin} disabled={facebookLoading} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#e2d6c8] bg-white text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#252020] transition hover:bg-[#fff8f0] disabled:opacity-60">
        <img src="/assets/icon/khac/ic_baseline-facebook.svg" alt="" className="h-5 w-5" />
        {facebookLoading ? 'Đang xử lý...' : 'Tiếp tục với Facebook'}
      </button>
      <div className="min-h-12 w-full">
        {googleClientId ? (
          <div className="relative min-h-12 w-full overflow-hidden rounded-full">
            <div ref={googleButtonRef} className="flex min-h-12 w-full items-center justify-center" />
            {googleLoading || !googleReady ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full border border-[#e2d6c8] bg-white text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#252020]">
                {googleLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
              </div>
            ) : null}
          </div>
        ) : (
          <button type="button" onClick={() => toast.error('Google Login chua duoc cau hinh')} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#e2d6c8] bg-white text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#252020] transition hover:bg-[#fff8f0]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#f5f5f5] text-[13px] font-black text-[#4285f4]">G</span>
            Tiếp tục với Google
          </button>
        )}
      </div>
    </div>
  );
}
