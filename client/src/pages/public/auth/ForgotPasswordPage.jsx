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
      toast.success(data.message || 'Vui long kiem tra email cua ban');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Khong gui duoc yeu cau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={<>Quen<br />mat khau</>}>
      <form onSubmit={submit} className="space-y-5">
        <AuthInput
          label="Dia chi email"
          type="email"
          placeholder="hello@pawworld.com"
          value={email}
          onChange={setEmail}
        />
        <PrimaryButton loading={loading}>Gui lien ket</PrimaryButton>
      </form>

      {resetUrl ? (
        <Link to={resetUrl} className="mt-5 block text-center text-[12px] font-extrabold text-[#a95620] underline">
          Mo lien ket dat lai mat khau
        </Link>
      ) : null}

      <p className="mt-7 text-center text-[12px] font-semibold text-[#6c5d50]">
        <Link className="font-extrabold uppercase text-[#a95620] underline" to="/dang-nhap">
          Quay lai dang nhap
        </Link>
      </p>
    </AuthShell>
  );
}
