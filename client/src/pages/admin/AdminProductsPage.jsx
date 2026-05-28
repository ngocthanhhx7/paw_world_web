import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { adminApi } from '@/api/endpoints';
import { formatPrice } from '@/utils/format';

const EMPTY = {
  _id: null,
  name: '',
  brand: '',
  category: '',
  price: '',
  salePrice: '',
  stock: 0,
  weight: '',
  flavor: '',
  ageRange: 'all',
  foodType: 'dry',
  healthNeeds: '',
  shortDescription: '',
  description: '',
  tags: '',
  isFeatured: false,
  isBestSeller: false,
  isActive: true,
};

const FOOD_TYPE_OPTIONS = [
  { value: 'dry', label: 'Đồ ăn khô' },
  { value: 'wet', label: 'Đồ ăn ướt' },
  { value: 'mixed', label: 'Kit kết hợp' },
  { value: 'supplement', label: 'Sữa / nước uống' },
  { value: 'accessory', label: 'Phụ kiện' },
];

const HEALTH_NEED_OPTIONS = [
  { value: 'digestion', label: 'Tiêu chảy' },
  { value: 'skin', label: 'Nấm da' },
  { value: 'hairball', label: 'Rụng lông' },
  { value: 'mother', label: 'Mang thai và cho con bú' },
];

const splitHealthNeeds = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | EMPTY | product
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    adminApi.listProducts({ q, limit: 50 }).then((d) => setItems(d.items || []));
  };

  useEffect(() => {
    load();
    adminApi.listCategories().then((d) => setCategories(d.items || []));
  }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  const openNew = () => {
    setEditing({ ...EMPTY });
    setImageFile(null);
  };

  const openEdit = (p) => {
    setEditing({
      ...EMPTY,
      ...p,
      category: p.category?._id || '',
      tags: (p.tags || []).join(', '),
      foodType: p.foodType || 'dry',
      healthNeeds: (p.healthNeeds || []).join(', '),
      salePrice: p.salePrice ?? '',
    });
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing.name || !editing.price) return toast.error('Vui lòng nhập tên và giá');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(editing).forEach(([k, v]) => {
        if (k === '_id') return;
        if (v === null || v === undefined) return;
        fd.append(k, typeof v === 'boolean' ? String(v) : v);
      });
      if (imageFile) fd.append('image', imageFile);

      if (editing._id) {
        await adminApi.updateProduct(editing._id, fd);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await adminApi.createProduct(fd);
        toast.success('Đã tạo sản phẩm');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lưu không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    try {
      await adminApi.deleteProduct(p._id);
      toast.success('Đã xoá');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xoá không thành công');
    }
  };

  const toggleHealthNeed = (value) => {
    setEditing((current) => {
      if (!current) return current;
      const selected = splitHealthNeeds(current.healthNeeds);
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return { ...current, healthNeeds: next.join(', ') };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-cocoa-700">Sản phẩm</h1>
          <p className="text-sm text-cocoa-400 mt-1">Quản lý {items.length} sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <div className="card p-2 flex items-center">
            <Search size={16} className="ml-2 text-cocoa-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên…"
              className="px-3 py-1.5 outline-none text-sm bg-transparent"
            />
          </div>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-100 text-cocoa-500 text-left">
              <tr>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Giá</th>
                <th className="p-3">Tồn kho</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-t border-cream-100">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || '/assets/paw/Cat Food Kit.png'}
                        className="w-12 h-12 rounded-2xl object-cover bg-cream-100"
                        alt=""
                      />
                      <div>
                        <div className="font-semibold text-cocoa-600 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-cocoa-300">{p.brand}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] text-cocoa-500">
                            {FOOD_TYPE_OPTIONS.find((option) => option.value === p.foodType)?.label || p.foodType || 'dry'}
                          </span>
                          {(p.healthNeeds || []).map((need) => (
                            <span
                              key={need}
                              className="rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] text-cocoa-500"
                            >
                              {HEALTH_NEED_OPTIONS.find((option) => option.value === need)?.label || need}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-cocoa-500">{p.category?.name || '—'}</td>
                  <td className="p-3">
                    <div className="text-coral-500 font-semibold">
                      {formatPrice(p.salePrice || p.price)}
                    </div>
                    {p.salePrice ? (
                      <div className="text-xs text-cocoa-300 line-through">
                        {formatPrice(p.price)}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    <span
                      className={`badge ${
                        p.isActive ? 'bg-leaf-500 text-white' : 'bg-cream-200 text-cocoa-500'
                      }`}
                    >
                      {p.isActive ? 'Đang bán' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-full hover:bg-cream-100"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 rounded-full hover:bg-coral-50 text-coral-500"
                      title="Xoá"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-cocoa-400">
                    Chưa có sản phẩm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-cocoa-700/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="card w-full max-w-2xl max-h-[90vh] overflow-auto p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-cocoa-700">
                {editing._id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 rounded-full hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <input
                className="input md:col-span-2"
                placeholder="Tên sản phẩm *"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <input
                className="input"
                placeholder="Thương hiệu"
                value={editing.brand}
                onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
              />
              <select
                className="input"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input"
                placeholder="Giá *"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Giá sale (nếu có)"
                value={editing.salePrice}
                onChange={(e) => setEditing({ ...editing, salePrice: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Tồn kho"
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
              />
              <select
                className="input"
                value={editing.ageRange}
                onChange={(e) => setEditing({ ...editing, ageRange: e.target.value })}
              >
                <option value="all">Mọi độ tuổi</option>
                <option value="kitten">Mèo con (Kitten)</option>
                <option value="adult">Mèo trưởng thành</option>
                <option value="senior">Mèo già</option>
              </select>
              <input
                className="input"
                placeholder="Trọng lượng (vd 1.5kg)"
                value={editing.weight}
                onChange={(e) => setEditing({ ...editing, weight: e.target.value })}
              />
              <select
                className="input"
                value={editing.foodType}
                onChange={(e) => setEditing({ ...editing, foodType: e.target.value })}
              >
                {FOOD_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2 rounded-2xl border border-cream-100 p-3">
                <div className="mb-2 text-sm font-semibold text-cocoa-600">
                  Nhu cầu sức khỏe dùng cho bộ lọc
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {HEALTH_NEED_OPTIONS.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={splitHealthNeeds(editing.healthNeeds).includes(option.value)}
                        onChange={() => toggleHealthNeed(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <input
                className="input"
                placeholder="Hương vị"
                value={editing.flavor}
                onChange={(e) => setEditing({ ...editing, flavor: e.target.value })}
              />
              <textarea
                className="input md:col-span-2"
                rows={2}
                placeholder="Mô tả ngắn"
                value={editing.shortDescription}
                onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              />
              <textarea
                className="input md:col-span-2"
                rows={4}
                placeholder="Mô tả chi tiết"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <input
                className="input md:col-span-2"
                placeholder="Tags (cách nhau dấu phẩy)"
                value={editing.tags}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
              />

              <div className="md:col-span-2 flex items-center gap-3">
                {editing.image && !imageFile && (
                  <img
                    src={editing.image}
                    className="w-16 h-16 rounded-2xl object-cover bg-cream-100"
                    alt=""
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>

              <label className="md:col-span-2 flex flex-wrap gap-4 text-sm pt-2">
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isFeatured}
                    onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                  />
                  Nổi bật
                </span>
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isBestSeller}
                    onChange={(e) => setEditing({ ...editing, isBestSeller: e.target.checked })}
                  />
                  Bán chạy
                </span>
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  />
                  Đang bán
                </span>
              </label>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-ghost"
              >
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
