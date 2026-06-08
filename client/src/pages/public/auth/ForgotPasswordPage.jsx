import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAuthApi } from '@/api/endpoints';
import AuthShell from './AuthShell';
import { AuthInput } from './LoginPage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await customerAuthApi.forgotPassword({ email });
      toast.success('Vui long kiem tra email cua ban');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Khong gui duoc yeu cau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Quen mat khau"
      subtitle="Nhap email de nhan lien ket dat lai mat khau."
      footer={<Link className="text-cocoa-700 underline" to="/dang-nhap">Quay lai dang nhap</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} />
        <button disabled={loading} className="w-full rounded-full bg-sun-400 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-cocoa-700 shadow-[0_8px_0_#d9a72d] transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? 'Dang gui...' : 'Gui lien ket'}
        </button>
      </form>
    </AuthShell>
  );
}
