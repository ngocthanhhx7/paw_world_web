import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';

import { productApi } from '@/api/endpoints';
import { formatPrice } from '@/utils/format';

/* ----------------------------- Static content ----------------------------- */

const PAINS = [
  {
    title: 'Mua sai loại',
    desc: 'Lúng túng giữa hàng trăm loại thực phẩm không rõ chất lượng.',
    icon: '/assets/icon/khac/Group 1321314349.svg',
    bg: 'bg-blush-100',
  },
  {
    title: 'Thiếu thời gian',
    desc: 'Bạn quá bận để cân đo từng gram dinh dưỡng mỗi ngày.',
    icon: '/assets/icon/khac/Group 1321314350.svg',
    bg: 'bg-lavender-100',
  },
  {
    title: 'Mèo bỏ ăn',
    desc: 'Mèo bỏ bữa vì thực đơn lặp lại hoặc không hợp khẩu vị.',
    icon: '/assets/icon/khac/Group 1321314351.svg',
    bg: 'bg-blush-100',
  },
  {
    title: 'Lãng phí tiền bạc',
    desc: 'Mua dư thừa, dùng không hết phải bỏ đi vô ích.',
    icon: '/assets/icon/khac/Group 1321314352.svg',
    bg: 'bg-mint-100',
  },
];

const STEPS = [
  {
    n: '1',
    color: 'bg-blush-400',
    title: 'Làm Quiz AI',
    desc: 'Kể cho AI nghe về tuổi, cân nặng và sở thích/nhu cầu của bé.',
  },
  {
    n: '2',
    color: 'bg-sun-400',
    title: 'Nhận Kit thiết kế riêng',
    desc: 'Chúng tôi sắp xếp thực đơn Mix Ướt & Khô theo đúng lộ trình 3-7 ngày.',
  },
  {
    n: '3',
    color: 'bg-lavender-500',
    title: 'Tận hưởng thời gian',
    desc: 'Thực phẩm tươi ngon giao tận tay, giúp bạn tiết kiệm thời gian quý báu.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Bé Bơ từ ngày ăn Kit của PawWorld lông mượt hẳn ra, lại còn không bao giờ bỏ bữa nữa!',
    cat: '/assets/cat/image 649.png',
    author: 'Chị Lan & Bơ',
    place: 'Quận 7, HCM',
    color: 'bg-blush-200',
    tape: 'bg-sun-300',
  },
  {
    quote:
      'Tiết kiệm được nhiều thời gian đi siêu thị chọn đồ. AI tư vấn cực kỳ chuẩn xác luôn.',
    cat: '/assets/cat/image 650.png',
    author: 'Anh Minh & Miu',
    place: 'Đống Đa, HN',
    color: 'bg-mint-200',
    tape: 'bg-sun-300',
  },
  {
    quote:
      'Thực phẩm đóng gói cực kỳ xinh xắn, sạch sẽ. Nhìn thôi là đã muốn cho con ăn rồi!',
    cat: '/assets/cat/image 651.png',
    author: 'Bạn Vy & Sữa',
    place: 'Thủ Đức, HCM',
    color: 'bg-lavender-200',
    tape: 'bg-blush-300',
  },
];

/* ----------------------------- Helper components ----------------------------- */

function MealCard({ product, badge, badgeColor, bg }) {
  const onSale =
    product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const price = onSale ? product.salePrice : product.price;
  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className="group block rounded-3xl bg-white shadow-card overflow-hidden hover:-translate-y-1 transition-transform duration-300"
    >
      <div className={`relative aspect-[4/3] ${bg} flex items-center justify-center`}>
        {badge && (
          <span
            className={`absolute top-4 left-4 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider text-white ${badgeColor}`}
          >
            {badge}
          </span>
        )}
        <img
          src={product.image || '/assets/paw/Cat Food Kit.png'}
          alt={product.name}
          className="max-h-[80%] object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-cocoa-500 leading-snug">{product.name}</h3>
        <p className="text-xs text-cocoa-400 mt-1 line-clamp-2 min-h-[2rem]">
          {product.shortDescription || product.description?.slice(0, 80) || ''}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-xl text-cocoa-500">{formatPrice(price)}</span>
          <span className="w-9 h-9 rounded-full bg-sun-400 text-cocoa-700 flex items-center justify-center shadow-sm">
            <ShoppingCart size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productApi.list({ limit: 3, sort: 'best_seller' }).then((d) => setProducts(d.items || []));
  }, []);

  // Fallback when DB chưa có sản phẩm — vẫn hiển thị 3 thẻ mẫu
  const display = products.length
    ? products.slice(0, 3)
    : [
        {
          _id: 'a',
          slug: '#',
          name: 'Kit Toàn Diện (Ướt & Khô)',
          shortDescription: 'Gói Tuần 1.5kg cho mèo trưởng thành (7 gói pate + 1.2kg hạt)',
          price: 450000,
          image: '/assets/paw/Cat Food Kit.png',
        },
        {
          _id: 'b',
          slug: '#',
          name: 'Kit Mèo Con #1',
          shortDescription: 'Mix Ướt/Khô – 3 Ngày dành riêng cho hệ tiêu hoá non nớt.',
          price: 220000,
          image: '/assets/paw/Cat Food Kit1.png',
        },
        {
          _id: 'c',
          slug: '#',
          name: 'Combo Nhạy Cảm',
          shortDescription: 'Thực đơn ít gây dị ứng, giàu Omega-3 cho bộ lông mượt mà.',
          price: 510000,
          image: '/assets/paw/cfc3d7f844b024807049920fc1a7bb55 1.png',
        },
      ];

  const cardConfigs = [
    { badge: 'BÁN CHẠY NHẤT', badgeColor: 'bg-blush-400', bg: 'bg-blush-200' },
    { badge: null, badgeColor: '', bg: 'bg-sun-300' },
    { badge: null, badgeColor: '', bg: 'bg-mint-300' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="container-paw py-10">
        <div className="rounded-[36px] bg-lavender-400 p-8 md:p-12 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center relative overflow-hidden">
          <div className="text-cocoa-500">
            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl leading-[1.05] text-cocoa-500">
              Chăm mèo<br />
              khoa học,<br />
              không còn<br />
              lãng phí.
            </h1>
            <p className="mt-6 max-w-md text-cocoa-500/80 text-[15px] leading-7">
              Meal Kit dinh dưỡng được thiết kế riêng bởi AI, giao tận cửa mỗi tuần. Ăn đúng,
              ăn đủ, không lãng phí.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/lien-he-tu-van" className="btn-primary !px-7 !py-3 text-base">
                Làm Quiz ngay
              </Link>
              <Link to="/danh-muc" className="btn !px-7 !py-3 text-base bg-white text-cocoa-500 hover:bg-lavender-100">
                Xem thực đơn
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-sun-300 p-4 md:p-6 aspect-[4/3.4] relative overflow-hidden shadow-[8px_10px_0_rgba(63,42,107,0.18)]">
              <img
                src="/assets/cat/Happy Cat User 2.png"
                alt="Mèo Paw World"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Floating tag */}
            <div className="absolute left-3 -bottom-3 md:-left-6 md:-bottom-6 bg-white rounded-2xl px-4 py-3 shadow-soft flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-mint-200 flex items-center justify-center text-mint-500">
                <Heart size={18} fill="currentColor" />
              </span>
              <div>
                <div className="text-xs font-bold text-cocoa-500">100% Tự nhiên</div>
                <div className="text-[10px] text-cocoa-400">Chứng nhận bởi chuyên gia</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="container-paw py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl text-cocoa-500">
            Nuôi mèo không nên là một cuộc chiến
          </h2>
          <p className="text-cocoa-400 mt-3 text-sm md:text-base">
            PawWorld sinh ra để giúp bạn giải quyết những nỗi lo thường trực.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_320px_1fr] gap-5 items-center">
          {/* Left column */}
          <div className="space-y-4 order-2 lg:order-1">
            {[PAINS[0], PAINS[2]].map((p) => (
              <div
                key={p.title}
                className={`${p.bg} rounded-3xl p-6 flex items-start gap-4 shadow-[6px_8px_0_rgba(63,42,107,0.08)]`}
              >
                <img src={p.icon} alt="" className="w-10 h-10 mt-0.5" />
                <div>
                  <div className="font-display text-xl text-cocoa-500">{p.title}</div>
                  <p className="text-sm text-cocoa-400 mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Center cat photo */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl overflow-hidden bg-cream-100 aspect-[4/5] shadow-soft">
              <img
                src="/assets/cat/image 154.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4 order-3">
            {[PAINS[1], PAINS[3]].map((p) => (
              <div
                key={p.title}
                className={`${p.bg} rounded-3xl p-6 flex items-start gap-4 shadow-[6px_8px_0_rgba(63,42,107,0.08)]`}
              >
                <img src={p.icon} alt="" className="w-10 h-10 mt-0.5" />
                <div>
                  <div className="font-display text-xl text-cocoa-500">{p.title}</div>
                  <p className="text-sm text-cocoa-400 mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="container-paw py-16">
        <div className="flex items-center gap-3 mb-10">
          <img src="/assets/paw/Cat Food Kit.png" alt="" className="w-10 h-10" />
          <h2 className="font-display text-3xl md:text-5xl text-cocoa-500">
            Quy trình 1-2-3 cho Sen thảnh thơi
          </h2>
        </div>

        <div className="relative grid md:grid-cols-3 gap-10">
          {/* dotted line */}
          <div
            className="hidden md:block absolute left-[16%] right-[16%] top-12 h-0.5 border-t-2 border-dashed border-cocoa-200/60"
            aria-hidden
          />
          {STEPS.map((s) => (
            <div key={s.n} className="text-center relative">
              <div
                className={`mx-auto w-24 h-24 rounded-full ${s.color} text-white font-display text-5xl flex items-center justify-center shadow-soft`}
              >
                {s.n}
              </div>
              <h3 className="font-display text-2xl mt-5 text-cocoa-500">{s.title}</h3>
              <p className="text-sm text-cocoa-400 mt-2 max-w-xs mx-auto leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <img src="/assets/paw/Cat Food Kit1.png" alt="" className="w-12 h-12 opacity-70" />
        </div>
      </section>

      {/* MEAL KIT GRID */}
      <section className="bg-lavender-100 py-16">
        <div className="container-paw">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-5xl text-cocoa-500">
                Thực đơn sẵn sàng
              </h2>
              <p className="text-cocoa-400 mt-2 text-sm">
                Chọn theo nhu cầu đặc biệt của bé yêu.
              </p>
            </div>
            <Link
              to="/danh-muc"
              className="text-sm font-bold text-cocoa-500 hover:text-sun-500"
            >
              Xem tất cả combo →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {display.map((p, i) => (
              <MealCard
                key={p._id}
                product={p}
                badge={cardConfigs[i].badge}
                badgeColor={cardConfigs[i].badgeColor}
                bg={cardConfigs[i].bg}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CSR */}
      <section className="container-paw py-16">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
          <div className="rounded-3xl overflow-hidden aspect-[5/4] bg-peach-200">
            <img
              src="/assets/cat/image 652.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl md:text-5xl text-cocoa-500 leading-tight">
              "Mỗi miếng ăn, một sự sẻ chia"
            </h2>
            <p className="mt-5 text-cocoa-500/80 text-[15px] leading-7 max-w-xl">
              Tại PawWorld, chúng tôi tin rằng mọi bé mèo đều xứng đáng có một bữa ăn ngon. Đó
              là lý do <strong>5%</strong> doanh thu từ mỗi đơn hàng sẽ được trích ra để hỗ
              trợ thực phẩm cho các trạm cứu hộ mèo lang thang.
            </p>

            <div className="mt-6 flex gap-10">
              <div>
                <div className="font-display text-4xl text-cocoa-500">15k+</div>
                <div className="text-xs text-cocoa-400 mt-1">Bữa ăn quyên góp</div>
              </div>
              <div>
                <div className="font-display text-4xl text-cocoa-500">12</div>
                <div className="text-xs text-cocoa-400 mt-1">Trạm cứu hộ đồng hành</div>
              </div>
            </div>

            <Link to="/gioi-thieu" className="btn-primary mt-7 inline-flex">
              Tìm hiểu thêm về quỹ
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-paw pb-20">
        <h2 className="font-display text-3xl md:text-5xl text-cocoa-500 text-center">
          Chia sẻ từ cộng đồng PawWorld
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-3xl ${t.color} pt-12 pb-6 px-6 shadow-[6px_8px_0_rgba(63,42,107,0.12)]`}
            >
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 ${t.tape} h-5 w-24 rounded-sm rotate-[-6deg] shadow`}
              />
              <div className="relative -mt-4 mb-4 flex justify-center">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-card">
                  <img src={t.cat} alt={t.author} className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-cocoa-500 text-sm leading-relaxed text-center italic">
                "{t.quote}"
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-cocoa-500">
                <span className="w-2 h-2 rounded-full bg-cocoa-500" />
                <strong>{t.author}</strong>
                <span className="ml-auto text-cocoa-400">{t.place}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
