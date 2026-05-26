import { useEffect, useState } from 'react';
import { Trash2, Phone, Mail, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';

const STATUSES = [
  { v: '', label: 'Tất cả' },
  { v: 'new', label: 'Mới' },
  { v: 'contacting', label: 'Đang liên hệ' },
  { v: 'done', label: 'Đã liên hệ' },
  { v: 'lost', label: 'Khách bỏ' },
];

const STATUS_COLOR = {
  new: 'bg-coral-500 text-white',
  contacting: 'bg-cream-500 text-cocoa-700',
  done: 'bg-leaf-500 text-white',
  lost: 'bg-cocoa-200 text-cocoa-700',
};

export default function AdminLeadsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = () =>
    adminApi.listLeads({ q, status, limit: 50 }).then((d) => setItems(d.items || []));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, status]); // eslint-disable-line

  const update = async (lead, patch) => {
    try {
      await adminApi.updateLead(lead._id, patch);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật không thành công');
    }
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Xoá yêu cầu của ${lead.fullName}?`)) return;
    try {
      await adminApi.deleteLead(lead._id);
      toast.success('Đã xoá');
      load();
    } catch {
      toast.error('Xoá không thành công');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-cocoa-700">Khách hàng cần liên hệ</h1>
          <p className="text-sm text-cocoa-400 mt-1">
            Danh sách khách để lại số điện thoại để được tư vấn / mua hàng.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="card p-2 flex items-center">
            <Search size={16} className="ml-2 text-cocoa-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên / SĐT…"
              className="px-3 py-1.5 outline-none text-sm bg-transparent"
            />
          </div>
          <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-100 text-cocoa-500 text-left">
              <tr>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Liên hệ</th>
                <th className="p-3">Sản phẩm quan tâm</th>
                <th className="p-3">Lời nhắn</th>
                <th className="p-3">Tạo lúc</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id} className="border-t border-cream-100 align-top">
                  <td className="p-3">
                    <div className="font-semibold text-cocoa-600">{l.fullName}</div>
                    <div className="text-xs text-cocoa-400">{l.source}</div>
                  </td>
                  <td className="p-3">
                    <a
                      href={`tel:${l.phone}`}
                      className="flex items-center gap-1 text-cream-700 font-semibold"
                    >
                      <Phone size={14} /> {l.phone}
                    </a>
                    {l.email && (
                      <a
                        href={`mailto:${l.email}`}
                        className="flex items-center gap-1 text-cocoa-400 text-xs mt-1"
                      >
                        <Mail size={14} /> {l.email}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-cocoa-500">
                    {l.productSnapshot?.name ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={l.productSnapshot.image || '/assets/paw/Cat Food Kit.png'}
                          className="w-10 h-10 rounded-xl object-cover bg-cream-100"
                          alt=""
                        />
                        <div className="text-xs">{l.productSnapshot.name}</div>
                      </div>
                    ) : (
                      <span className="text-cocoa-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-cocoa-500 max-w-xs">{l.message || '—'}</td>
                  <td className="p-3 text-cocoa-500">{formatDate(l.createdAt)}</td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) => update(l, { status: e.target.value })}
                      className={`badge ${STATUS_COLOR[l.status]} border-0 text-xs cursor-pointer`}
                    >
                      {STATUSES.filter((s) => s.v).map((s) => (
                        <option key={s.v} value={s.v}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(l)}
                      className="p-2 rounded-full hover:bg-coral-50 text-coral-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-cocoa-400">
                    Chưa có khách nào để lại thông tin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
