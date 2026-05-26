import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { admin, login, ready, init } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (ready && admin) navigate('/admin/dashboard', { replace: true });
  }, [ready, admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success('Đăng nhập thành công');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-cream-50">
      <div className="hidden md:flex flex-col justify-between bg-cocoa-500 text-cream-100 p-10 relative overflow-hidden">
        <Link to="/">
          <img src="/assets/logo/ngang.png" alt="Paw World" className="h-12 brightness-0 invert" />
        </Link>
        <div>
          <h2 className="font-display text-4xl text-cream-50 leading-tight">
            Trang quản trị <br /> Paw World
          </h2>
          <p className="text-cream-100/80 mt-3 max-w-sm">
            Quản lý sản phẩm, đơn hàng và khách hàng cần liên hệ trong cùng một nơi.
          </p>
        </div>
        <img
          src="/assets/cat/2.png"
          alt=""
          className="absolute -right-10 -bottom-10 w-80 opacity-90"
        />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="card w-full max-w-md p-8">
          <h1 className="font-display text-3xl text-cocoa-700">Đăng nhập admin</h1>
          <p className="text-sm text-cocoa-400 mt-1">
            Sử dụng tài khoản được Paw World cấp để vào hệ thống.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 mt-6">
            <input
              type="email"
              autoComplete="email"
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-12"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-300"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button disabled={submitting} className="btn-primary w-full">
              <LogIn size={16} /> {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 text-xs text-cocoa-400 text-center">
            Tài khoản mặc định:{' '}
            <code className="bg-cream-100 px-2 py-1 rounded">admin@pawworld.vn / pawworld@123</code>
          </div>

          <Link to="/" className="block mt-6 text-center text-sm text-cocoa-400 hover:underline">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
