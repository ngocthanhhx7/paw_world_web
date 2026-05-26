import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, Phone } from 'lucide-react';

import { orderApi } from '@/api/endpoints';
import { formatPrice, formatDate } from '@/utils/format';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export default function OrderSuccessPage() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!code) return;
    orderApi.getByCode(code).then(setOrder).catch(() => setOrder(null));
  }, [code]);

  return (
    <div className="container-paw py-14">
      <div className="card max-w-2xl mx-auto p-8 text-center">
        <CheckCircle2 size={64} className="text-leaf-500 mx-auto" />
        <h1 className="font-display text-3xl mt-3 text-cocoa-700">Đặt hàng thành công!</h1>
        <p className="text-cocoa-400 mt-2">
          Cảm ơn bạn đã mua sắm tại Paw World. Đội ngũ sẽ liên hệ xác nhận đơn trong vòng 30 phút.
        </p>

        <div className="bg-cream-100 rounded-2xl p-4 mt-6 text-left">
          <div className="text-xs text-cocoa-400">Mã đơn hàng</div>
          <div className="font-display text-2xl text-cocoa-700">{code}</div>
          {order && (
            <div className="text-xs text-cocoa-400 mt-1">
              Đặt lúc {formatDate(order.createdAt)} · Trạng thái:{' '}
              <span className="font-semibold text-cocoa-600">{STATUS_LABEL[order.status]}</span>
            </div>
          )}
        </div>

        {order && (
          <div className="mt-5 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-cocoa-400">Người nhận</span>
              <span className="font-semibold">{order.customer.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cocoa-400">SĐT</span>
              <span className="font-semibold">{order.customer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cocoa-400">Địa chỉ</span>
              <span className="font-semibold text-right max-w-xs">
                {[
                  order.shippingAddress.address,
                  order.shippingAddress.ward,
                  order.shippingAddress.district,
                  order.shippingAddress.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            <div className="flex justify-between border-t border-cream-200 pt-2 mt-2">
              <span className="text-cocoa-400">Tổng cộng</span>
              <span className="font-display text-xl text-coral-500">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/danh-muc" className="btn-primary">
            <Package size={16} /> Tiếp tục mua sắm
          </Link>
          <a href="tel:0909123456" className="btn-outline">
            <Phone size={16} /> Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
}
