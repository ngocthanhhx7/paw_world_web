import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthShell from './AuthShell';
import { AuthInput, PrimaryButton } from './LoginPage';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function ForgotPasswordPage() {
  const forgotPassword = useCustomerAuthStore((s) => s.forgotPassword);
  const [email, setEmail] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPassword({ email });
      setResetUrl(data.resetUrl || '');
      toast.success(data.message || 'Vui lòng kiểm tra email của bạn');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không gửi được yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Quên<br />mật khẩu</>} subtitle="Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.">
      <form onSubmit={submit} className="space-y-5">
        <AuthInput label="Địa chỉ email" type="email" placeholder="hello@pawworld.com" value={email} onChange={setEmail} />
        <PrimaryButton loading={loading}>Gửi liên kết</PrimaryButton>
      </form>

      {resetUrl ? <Link to={resetUrl} className="mt-5 block text-center text-[12px] font-extrabold text-[#a95620] underline">Mở liên kết đặt lại mật khẩu</Link> : null}

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        <Link className="font-extrabold uppercase text-[#a95620] underline" to="/dang-nhap">Quay lại đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
