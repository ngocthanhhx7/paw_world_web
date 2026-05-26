import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/endpoints';

const EMPTY = { _id: null, name: '', description: '', sortOrder: 0, isActive: true };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => adminApi.listCategories().then((d) => setItems(d.items || []));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing.name) return toast.error('Vui lòng nhập tên');
    setSubmitting(true);
    try {
      if (editing._id) {
        await adminApi.updateCategory(editing._id, editing);
        toast.success('Đã cập nhật');
      } else {
        await adminApi.createCategory(editing);
        toast.success('Đã tạo danh mục');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Xoá danh mục "${c.name}"?`)) return;
    try {
      await adminApi.deleteCategory(c._id);
      toast.success('Đã xoá');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xoá không thành công');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-cocoa-700">Danh mục sản phẩm</h1>
          <p className="text-sm text-cocoa-400 mt-1">Tổng {items.length} danh mục</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-100 text-cocoa-500 text-left">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Thứ tự</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id} className="border-t border-cream-100">
                <td className="p-3 font-semibold text-cocoa-600">{c.name}</td>
                <td className="p-3 text-cocoa-400">{c.slug}</td>
                <td className="p-3 text-cocoa-500 max-w-xs truncate">{c.description}</td>
                <td className="p-3">{c.sortOrder}</td>
                <td className="p-3">
                  <span
                    className={`badge ${
                      c.isActive ? 'bg-leaf-500 text-white' : 'bg-cream-200 text-cocoa-500'
                    }`}
                  >
                    {c.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setEditing({ ...EMPTY, ...c })}
                    className="p-2 rounded-full hover:bg-cream-100"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 rounded-full hover:bg-coral-50 text-coral-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-cocoa-700/50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-cocoa-700">
                {editing._id ? 'Sửa danh mục' : 'Thêm danh mục'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 rounded-full hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <input
                className="input"
                placeholder="Tên danh mục *"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <textarea
                className="input"
                rows={3}
                placeholder="Mô tả"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Thứ tự hiển thị"
                value={editing.sortOrder}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                Hiển thị trên website
              </label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                Huỷ
              </button>
              <button disabled={submitting} className="btn-primary">
                {submitting ? 'Đang lưu…' : editing._id ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
