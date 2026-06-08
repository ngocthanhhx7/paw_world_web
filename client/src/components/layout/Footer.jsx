import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { leadApi } from '@/api/endpoints';

const PRODUCT_LINKS = [
  { label: 'Meal Kit Cá Nhân Hóa', to: '/meow-quizz' },
  { label: 'Meal Kit cho mèo con', to: '/danh-muc/thuc-an-hat-mem' },
  { label: 'Meal Kit cho mèo lớn', to: '/danh-muc/hat-kho-cho-meo' },
  { label: 'Phụ Kiện Chăm Sóc', to: '/danh-muc/phu-kien-an-uong' },
];

const SUPPORT_LINKS = [
  { label: 'Meow Quizz', to: '/meow-quizz' },
  { label: 'Về chúng tôi', to: '/gioi-thieu' },
  { label: 'Liên hệ tư vấn', to: '/lien-he-tu-van' },
  { label: 'Chính sách vận chuyển', to: '/chinh-sach-van-chuyen' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Nhập email của bạn nhé!');
    setSubmitting(true);
    try {
      await leadApi.create({
        fullName: 'Newsletter subscriber',
        phone: '0000000000',
        email,
        source: 'newsletter',
        message: 'Đăng ký nhận tin từ footer',
      });
      toast.success('Cảm ơn bạn! Voucher 20k sẽ được gửi qua email.');
      setEmail('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không gửi được, thử lại nhé');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mt-10 bg-lavender-100 text-cocoa-500">
      <div className="container-paw py-12 grid lg:grid-cols-[1.1fr_1fr_1fr_1.2fr] gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo/ngang.png" alt="PawWorld" className="h-9" />
          </Link>
          <p className="mt-4 text-sm text-cocoa-500/80 leading-relaxed">
            Mỗi bữa ăn,
            <br />
            Một vòng tay nhân ái.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-white hover:bg-sun-200 flex items-center justify-center transition"
              aria-label="Facebook"
            >
              <img src="/assets/icon/khac/ic_baseline-facebook.svg" alt="" className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-white hover:bg-sun-200 flex items-center justify-center transition"
              aria-label="Tiktok"
            >
              <img src="/assets/icon/khac/Tiktok.svg" alt="" className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-white hover:bg-sun-200 flex items-center justify-center transition"
              aria-label="Instagram"
            >
              <img src="/assets/icon/khac/Instagram.svg" alt="" className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-[0.12em] text-cocoa-500 mb-4">
            SẢN PHẨM
          </h4>
          <ul className="space-y-2 text-sm">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-cocoa-500/80 hover:text-cocoa-500">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-[0.12em] text-cocoa-500 mb-4">
            HỖ TRỢ
          </h4>
          <ul className="space-y-2 text-sm">
            {SUPPORT_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-cocoa-500/80 hover:text-cocoa-500">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-[0.12em] text-cocoa-500 mb-4">
            ĐĂNG KÝ NHẬN TIN
          </h4>
          <p className="text-sm text-cocoa-500/80 mb-3">
            Nhận ngay voucher 20k cho đơn hàng đầu tiên!
          </p>
          <form onSubmit={subscribe} className="space-y-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn..."
              className="input bg-white/90"
            />
            <button disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Đang gửi…' : 'Gửi'}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-lavender-200">
        <div className="container-paw py-4 text-xs text-cocoa-500/70 flex flex-col md:flex-row justify-between gap-2">
          <span>© 2026 PawWorld. All rights reserved. Keep on wagging!</span>
          <div className="flex gap-5">
            <Link to="/chinh-sach-bao-mat" className="hover:text-cocoa-500">
              Privacy Policy
            </Link>
            <Link to="/dieu-khoan" className="hover:text-cocoa-500">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
