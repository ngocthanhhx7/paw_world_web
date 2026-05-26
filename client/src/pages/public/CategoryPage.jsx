import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  PawPrint,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { productApi, categoryApi } from '@/api/endpoints';
import { useCartStore } from '@/store/cartStore';
import { cx, formatPrice } from '@/utils/format';

const PAGE_SIZE = 6;

const FILTERS = [
  {
    title: 'Độ tuổi',
    key: 'ageRange',
    options: [
      { label: 'Mèo con (<1 năm)', value: 'kitten' },
      { label: 'Mèo trưởng thành (1-7 năm)', value: 'adult' },
      { label: 'Mèo lớn tuổi (>7 năm)', value: 'senior' },
    ],
  },
  {
    title: 'Thực phẩm',
    key: 'food',
    options: [
      { label: 'Đồ ăn ướt', value: 'wet' },
      { label: 'Đồ ăn khô', value: 'dry' },
    ],
  },
  {
    title: 'Nhu cầu & sức khỏe',
    key: 'need',
    options: [
      { label: 'Tiêu chảy', value: 'digestion' },
      { label: 'Nấm da', value: 'skin' },
      { label: 'Rụng lông', value: 'hairball' },
      { label: 'Mang thai và cho con bú', value: 'mother' },
    ],
  },
  {
    title: 'Giá thành',
    key: 'sort',
    options: [
      { label: 'Thấp đến cao', value: 'price_asc' },
      { label: 'Cao đến thấp', value: 'price_desc' },
    ],
  },
];

/* const NEED_QUERY = {
  digestion: 'tiêu hóa',
  skin: 'da',
  hairball: 'lông',
  mother: 'mèo mẹ',
};

*/
function FilterCheckbox({ checked, label, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px] leading-6 text-[#242424]">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        aria-hidden="true"
        className={cx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border border-[#B8C4FF] bg-white',
          checked && 'bg-[#BFC4F2]',
        )}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-[2px] bg-[#3F2A6B]" />}
      </span>
      {label}
    </label>
  );
}

function FilterPanel({ values, onToggle, onClear }) {
  return (
    <aside className="overflow-hidden rounded-[16px] bg-[#EFEFEF] lg:sticky lg:top-28">
      <div className="flex h-[102px] items-center gap-5 bg-[#BFC4F2] px-11 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#BFC4F2]">
          <PawPrint size={28} strokeWidth={2.5} />
        </span>
        <h2 className="text-2xl font-bold uppercase tracking-normal">Bộ lọc</h2>
      </div>

      <div className="px-7 py-7">
        {FILTERS.map((section, index) => (
          <div
            key={section.key}
            className={cx(index !== FILTERS.length - 1 && 'border-b border-[#D5D5D5] pb-8 mb-8')}
          >
            <div className="mb-7 flex items-center justify-between">
              <h3 className="text-[24px] font-extrabold tracking-[-0.01em] text-[#333333]">
                {section.title}
              </h3>
              <ChevronUp size={25} strokeWidth={2.3} className="text-[#1C1B1B]" />
            </div>

            <div className="space-y-4">
              {section.options.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={values[section.key] === option.value}
                  onChange={() => onToggle(section.key, option.value)}
                />
              ))}
            </div>
          </div>
        ))}

        {(values.ageRange || values.food || values.need || values.sort !== 'newest') && (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 text-sm font-bold text-[#3F2A6B] underline underline-offset-4"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </aside>
  );
}

function ProductTile({ product }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
  const disabled = product.stock <= 0;

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) {
      toast.error('Sản phẩm đang tạm hết hàng');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thêm được sản phẩm');
    }
  };

  return (
    <article className="group">
      <Link to={`/san-pham/${product.slug}`} className="block">
        <div className="relative aspect-[1.05] overflow-hidden rounded-[6px] bg-[#F5F1ED]">
          <img
            src={product.image || '/assets/paw/Cat Food Kit.png'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {product.isBestSeller && (
            <span className="absolute left-4 top-4 rounded-[3px] bg-[#75CCA4] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.02em] text-white">
              Bán chạy nhất
            </span>
          )}
          {disabled && (
            <span className="absolute right-4 top-4 rounded-[3px] bg-[#252020] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.02em] text-white">
              Hết hàng
            </span>
          )}
        </div>

        <div className="pt-6">
          <h3 className="line-clamp-2 min-h-[58px] text-[22px] font-extrabold leading-[1.25] text-[#1C1B1B]">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-[58px] text-[17px] leading-[1.7] text-[#3A2C2C]">
            {product.shortDescription || product.description || 'Gói meal kit được lựa chọn theo nhu cầu của bé.'}
          </p>
        </div>
      </Link>

      <div className="mt-4 border-t border-dashed border-[#CFCFCF] pt-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[24px] font-extrabold tracking-[-0.01em] text-[#1C1B1B]">
              {formatPrice(price)}
            </p>
            {product.salePrice && product.salePrice > 0 && product.salePrice < product.price && (
              <p className="mt-1 text-sm text-[#8E8E8E] line-through">{formatPrice(product.price)}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className={cx(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] text-white transition',
              disabled ? 'cursor-not-allowed bg-[#D8D8D8]' : 'bg-[#FFC52E] hover:bg-[#FFB800]',
            )}
            aria-label="Thêm vào giỏ hàng"
          >
            <ShoppingCart size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const middle = Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1);
  const showLast = totalPages > 4;

  return (
    <nav className="mt-20 flex items-center justify-center gap-3" aria-label="Phân trang">
      <button
        type="button"
        onClick={() => onPage(1)}
        disabled={page === 1}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFC4F2] bg-white text-[#111111] disabled:opacity-45"
        aria-label="Trang đầu"
      >
        <ChevronsLeft size={24} />
      </button>
      <button
        type="button"
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFC4F2] bg-white text-[#111111] disabled:opacity-45"
        aria-label="Trang trước"
      >
        <ChevronLeft size={24} />
      </button>

      {middle.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPage(n)}
          className={cx(
            'flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold',
            page === n
              ? 'border-[#BFC4F2] bg-[#BFC4F2] text-white'
              : 'border-[#BFC4F2] bg-white text-[#111111]',
          )}
        >
          {n}
        </button>
      ))}

      {showLast && (
        <>
          <span className="px-4 text-lg text-[#111111]">...</span>
          <button
            type="button"
            onClick={() => onPage(totalPages)}
            className={cx(
              'flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold',
              page === totalPages
                ? 'border-[#BFC4F2] bg-[#BFC4F2] text-white'
                : 'border-[#BFC4F2] bg-white text-[#111111]',
            )}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFC4F2] bg-white text-[#111111] disabled:opacity-45"
        aria-label="Trang sau"
      >
        <ChevronRight size={24} />
      </button>
      <button
        type="button"
        onClick={() => onPage(totalPages)}
        disabled={page === totalPages}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#BFC4F2] bg-white text-[#111111] disabled:opacity-45"
        aria-label="Trang cuối"
      >
        <ChevronsRight size={24} />
      </button>
    </nav>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  const page = Number(searchParams.get('page') || 1);
  const filters = {
    ageRange: searchParams.get('ageRange') || '',
    food: searchParams.get('food') || '',
    need: searchParams.get('need') || '',
    sort: searchParams.get('sort') || 'newest',
  };

  const currentCategory = useMemo(
    () => categories.find((category) => category.slug === slug),
    [categories, slug],
  );

  useEffect(() => {
    categoryApi.list().then((data) => setCategories(data.items || []));
  }, []);

  useEffect(() => {
    setLoading(true);

    productApi
      .list({
        category: slug || undefined,
        q: q || undefined,
        sort: filters.sort,
        ageRange: filters.ageRange || undefined,
        foodType: filters.food || undefined,
        healthNeed: filters.need || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then((data) => {
        setProducts(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .finally(() => setLoading(false));
  }, [slug, q, filters.ageRange, filters.food, filters.need, filters.sort, page]);

  const updateParams = (next) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      Object.entries(next).forEach(([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
      params.set('page', '1');
      return params;
    });
  };

  const handleToggle = (key, value) => {
    updateParams({ [key]: filters[key] === value ? '' : value });
  };

  const handleClear = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      ['ageRange', 'food', 'need', 'sort', 'page'].forEach((key) => params.delete(key));
      return params;
    });
  };

  const handlePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(nextPage));
      return params;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = currentCategory?.name || (q ? `Kết quả cho "${q}"` : 'Shop Meal Kit');

  return (
    <div className="bg-white pb-24 text-[#1C1B1B]">
      <div className="container-paw pt-9">
        <div className="mb-24">
          <Link
            to="/"
            className="mb-1 inline-flex h-8 w-8 items-center justify-center text-[#32104D]"
            aria-label="Quay lại"
          >
            <ArrowLeft size={25} strokeWidth={2.1} />
          </Link>
          <nav className="ml-8 text-xs text-[#9A9A9A]">
            <Link to="/" className="hover:text-[#32104D]">
              Trang chủ
            </Link>
            <span className="mx-1.5">&gt;</span>
            <span>{currentCategory?.name || 'Shop Meal Kit'}</span>
          </nav>
          <h1 className="ml-8 mt-1 text-[18px] font-semibold text-[#32104D]">{pageTitle}</h1>
        </div>

        <div className="grid gap-12 lg:grid-cols-[307px_1fr] lg:gap-[92px]">
          <FilterPanel values={filters} onToggle={handleToggle} onClear={handleClear} />

          <section>
            {loading ? (
              <div className="grid gap-x-[88px] gap-y-[70px] md:grid-cols-2">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-[1.05] rounded-[6px] bg-[#F1F1F1]" />
                    <div className="mt-6 h-6 w-4/5 rounded bg-[#F1F1F1]" />
                    <div className="mt-4 h-4 w-full rounded bg-[#F1F1F1]" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-[#F1F1F1]" />
                    <div className="mt-8 h-7 w-28 rounded bg-[#F1F1F1]" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[16px] border border-[#E5E5E5] bg-white px-8 py-20 text-center">
                <img
                  src="/assets/cat/image 168.png"
                  alt=""
                  className="mx-auto h-36 w-36 object-contain"
                />
                <h2 className="mt-6 text-2xl font-extrabold text-[#32104D]">
                  Chưa có sản phẩm phù hợp
                </h2>
                <p className="mt-2 text-[#5A4A4A]">
                  Thử bỏ bớt bộ lọc hoặc quay lại toàn bộ Shop Meal Kit.
                </p>
                <button type="button" onClick={handleClear} className="btn-primary mt-6">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-x-[88px] gap-y-[70px] md:grid-cols-2">
                  {products.map((product) => (
                    <ProductTile key={product._id} product={product} />
                  ))}
                </div>

                <Pagination page={pagination.page || page} totalPages={pagination.totalPages || 1} onPage={handlePage} />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
