import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { leadApi } from '@/api/endpoints';

export default function ContactRequestPage() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error('Nhập tên và số điện thoại nhé');
    setSubmitting(true);
    try {
      await leadApi.create({ ...form, source: 'contact-page' });
      toast.success('Đã nhận thông tin, Paw World sẽ gọi bạn sớm!');
      setForm({ fullName: '', phone: '', email: '', message: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gửi không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-paw py-10 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
      <section>
        <span className="badge bg-cream-500 text-cocoa-700">Tư vấn miễn phí</span>
        <h1 className="text-3xl md:text-4xl mt-3 text-cocoa-700">
          Để Paw World gọi cho bạn
        </h1>
        <p className="text-cocoa-400 mt-3 leading-relaxed">
          Bạn đang phân vân không biết chọn loại hạt nào, mèo con kén ăn, hay muốn xây dựng thực đơn
          cho boss? Để lại thông tin, đội ngũ Paw World sẽ gọi tư vấn miễn phí trong 30 phút.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <div className="card p-4 flex items-start gap-3">
            <Phone size={20} className="text-cream-700" />
            <div>
              <div className="text-xs text-cocoa-400">Hotline</div>
              <div className="font-semibold text-cocoa-600">0909.123.456</div>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <Mail size={20} className="text-coral-500" />
            <div>
              <div className="text-xs text-cocoa-400">Email</div>
              <div className="font-semibold text-cocoa-600">hello@pawworld.vn</div>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3 sm:col-span-2">
            <MapPin size={20} className="text-leaf-500" />
            <div>
              <div className="text-xs text-cocoa-400">Cửa hàng</div>
              <div className="font-semibold text-cocoa-600">268 Lý Thường Kiệt, Q.10, TP.HCM</div>
            </div>
          </div>
        </div>

        <img
          src="/assets/cat/Happy Cat User 2.png"
          alt=""
          className="mt-8 max-w-sm drop-shadow-[0_30px_40px_rgba(90,58,27,0.25)]"
        />
      </section>

      <section className="card p-6 md:p-8">
        <h2 className="text-2xl text-cocoa-700 inline-flex items-center gap-2">
          <MessageCircle size={22} /> Để lại thông tin liên hệ
        </h2>
        <p className="text-sm text-cocoa-400 mt-1">
          Chúng tôi cam kết bảo mật thông tin của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-5">
          <input
            className="input"
            placeholder="Họ và tên *"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Số điện thoại *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="input"
            placeholder="Email (không bắt buộc)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <textarea
            className="input"
            rows={4}
            placeholder="Bạn cần Paw World tư vấn điều gì?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Đang gửi…' : 'Gửi yêu cầu tư vấn'}
          </button>
        </form>
      </section>
    </div>
  );
}
