import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';

import HomePage from '@/pages/public/HomePage';
import AboutPage from '@/pages/public/AboutPage';
import CategoryPage from '@/pages/public/CategoryPage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';
import CartPage from '@/pages/public/CartPage';
import CheckoutPage from '@/pages/public/CheckoutPage';
import OrderSuccessPage from '@/pages/public/OrderSuccessPage';
import ContactRequestPage from '@/pages/public/ContactRequestPage';
import OrderTrackingPage from '@/pages/public/OrderTrackingPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import LoginPage from '@/pages/public/auth/LoginPage';
import RegisterPage from '@/pages/public/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/public/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/auth/ResetPasswordPage';
import MeowQuizPage from '@/pages/public/meowQuizz/MeowQuizPage';
import PetProfilesPage from '@/pages/public/meowQuizz/PetProfilesPage';
import PetProfileEditPage from '@/pages/public/meowQuizz/PetProfileEditPage';
import RecommendationPage from '@/pages/public/meowQuizz/RecommendationPage';

import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage';
import RequireAdmin from '@/components/admin/RequireAdmin';

import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function App() {
  const fetchCart = useCartStore((s) => s.fetch);
  const initAuth = useAuthStore((s) => s.init);
  const initCustomerAuth = useCustomerAuthStore((s) => s.init);

  useEffect(() => {
    fetchCart();
    initAuth();
    initCustomerAuth();
  }, [fetchCart, initAuth, initCustomerAuth]);

  return (
    <Routes>
      {/* Public site */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/danh-muc" element={<CategoryPage />} />
        <Route path="/danh-muc/:slug" element={<CategoryPage />} />
        <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/dat-hang-thanh-cong/:code" element={<OrderSuccessPage />} />
        <Route path="/lien-he-tu-van" element={<ContactRequestPage />} />
        <Route path="/tra-cuu-don-hang" element={<OrderTrackingPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/dat-lai-mat-khau/:token" element={<ResetPasswordPage />} />
        <Route path="/meow-quizz" element={<MeowQuizPage />} />
        <Route path="/meow-quizz/ho-so" element={<PetProfilesPage />} />
        <Route path="/meow-quizz/ho-so/:id/chinh-sua" element={<PetProfileEditPage />} />
        <Route path="/meow-quizz/ket-qua/:profileId" element={<RecommendationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
      </Route>
    </Routes>
  );
}
