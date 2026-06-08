import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthShell from './AuthShell';
import { PasswordInput, PrimaryButton } from './LoginPage';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const resetPassword = useCustomerAuthStore((s) => s.resetPassword);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      toast.success('Đã đặt lại mật khẩu');
      navigate('/dang-nhap', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không đặt lại được mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Đặt lại<br />mật khẩu</>} subtitle="Tạo mật khẩu mới để tiếp tục sử dụng tài khoản PawWorld.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">Mật khẩu mới</label>
          <PasswordInput value={form.password} show={showPassword} onToggle={() => setShowPassword((value) => !value)} onChange={(password) => setForm((value) => ({ ...value, password }))} />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#252020]">Xác nhận mật khẩu</label>
          <PasswordInput value={form.confirmPassword} show={showConfirm} onToggle={() => setShowConfirm((value) => !value)} onChange={(confirmPassword) => setForm((value) => ({ ...value, confirmPassword }))} />
        </div>
        <PrimaryButton loading={loading}>Lưu mật khẩu</PrimaryButton>
      </form>

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        <Link className="font-extrabold uppercase text-[#a95620] underline" to="/dang-nhap">Quay lại đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
