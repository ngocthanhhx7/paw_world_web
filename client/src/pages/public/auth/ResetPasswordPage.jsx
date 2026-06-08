import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerAuthApi } from '@/api/endpoints';
import AuthShell from './AuthShell';
import { AuthInput } from './LoginPage';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await customerAuthApi.resetPassword(token, { password });
      toast.success('Da dat lai mat khau');
      navigate('/dang-nhap', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Khong dat lai duoc mat khau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Dat lai mat khau"
      subtitle="Chon mat khau moi cho tai khoan PawWorld."
      footer={<Link className="text-cocoa-700 underline" to="/dang-nhap">Quay lai dang nhap</Link>}
    >
      <form onSubmit={submit} className="space-y-5">
        <AuthInput label="Mat khau moi" type="password" value={password} onChange={setPassword} />
        <button disabled={loading} className="w-full rounded-full bg-sun-400 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-cocoa-700 shadow-[0_8px_0_#d9a72d] transition hover:-translate-y-0.5 disabled:opacity-60">
          {loading ? 'Dang luu...' : 'Dat lai mat khau'}
        </button>
      </form>
    </AuthShell>
  );
}
