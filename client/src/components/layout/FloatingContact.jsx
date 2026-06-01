import { Phone, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function FloatingContact() {
  const { pathname } = useLocation();

  if (pathname === '/gioi-thieu') {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-5 z-30 flex flex-col gap-3 sm:bottom-5 sm:right-24 lg:right-28">
      <Link
        to="/lien-he-tu-van"
        className="flex items-center gap-2 bg-cream-500 text-cocoa-700 px-4 py-3 rounded-full shadow-soft font-semibold hover:-translate-y-0.5 transition"
      >
        <MessageCircle size={18} /> Tư vấn miễn phí
      </Link>
      <a
        href="tel:0909123456"
        className="flex items-center gap-2 bg-cocoa-500 text-cream-50 px-4 py-3 rounded-full shadow-soft font-semibold hover:-translate-y-0.5 transition"
      >
        <Phone size={18} /> 0909.123.456
      </a>
    </div>
  );
}
