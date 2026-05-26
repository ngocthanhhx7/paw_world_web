import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function RequireAdmin({ children }) {
  const { admin, ready } = useAuthStore();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 text-cocoa-400">
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
