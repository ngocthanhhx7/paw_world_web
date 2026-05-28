import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Clock3,
  Heart,
  ShoppingCart,
  UtensilsCrossed,
  BadgeCheck,
} from 'lucide-react';

import { productApi } from '@/api/endpoints';
import { formatPrice } from '@/utils/format';

/* ----------------------------- Static content ----------------------------- */

const PAINS = [
  {
    title: 'Mua sai loại',
    desc: 'Lúng túng giữa hàng trăm loại thực phẩm không rõ chất lượng.',
    Icon: ShoppingCart,
    border: 'border-[#B8C4FF]',
    bg: 'bg-[#FFFBEF]',
    iconColor: 'text-[#7B57BD]',
  },
  {
    title: 'Mèo bỏ ăn',
    desc: 'Mèo bỏ bữa vì thực đơn lặp lại hoặc không hợp khẩu vị.',
    Icon: UtensilsCrossed,
    border: 'border-[#F7C7DA]',
    bg: 'bg-[#EAF6EF]',
    iconColor: 'text-[#FF6477]',
  },
  {
    title: 'Thiếu thời gian',
    desc: 'Bạn quá bận để cân đo từng gram dinh dưỡng mỗi ngày.',
    Icon: Clock3,
    border: 'border-[#FF927F]',
    bg: 'bg-[#EAF6EF]',
    iconColor: 'text-[#FF6B47]',
  },
  {
    title: 'Lãng phí tiền bạc',
    desc: 'Mua dư thừa, dùng không hết phải bỏ đi vô ích.',
    Icon: Banknote,
    border: 'border-[#66CC99]',
    bg: 'bg-[#FFFBEF]',
    iconColor: 'text-[#3FB075]',
  },
];

const STEPS = [
  {
    n: '1',
    color: 'bg-[#E89478]',
    title: 'Làm Quiz AI',
    desc: 'Kể cho AI nghe về tuổi, cân nặng và sở thích/nhu cầu của bé.',
  },
  {
    n: '2',
    color: 'bg-[#6FBF93]',
    title: 'Nhận Kit thiết kế riêng',
    desc: 'Chúng tôi sắp xếp thực đơn Mix Ướt & Khô theo đúng lộ trình 3-7 ngày.',
  },
  {
    n: '3',
    color: 'bg-[#A99BD9]',
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
    color: 'bg-[#F4C8D6]',
    dot: 'bg-[#9D7AD9]',
    tape: 'tape-cat',
    tapePos: 'top-3 -left-4 -rotate-[18deg]',
    tilt: '-rotate-[3deg]',
    offsetY: 'mt-4',
  },
  {
    quote:
      'Tiết kiệm được nhiều thời gian đi siêu thị chọn đồ. AI tư vấn cực kỳ chuẩn xác luôn.',
    cat: '/assets/cat/image 650.png',
    author: 'Anh Minh & Miu',
    place: 'Đống Đa, HN',
    color: 'bg-[#7FCBA9]',
    dot: 'bg-[#7E5733]',
    tape: 'tape-lemon',
    tapePos: '-top-3 right-6 rotate-[14deg]',
    tilt: 'rotate-[1deg]',
    offsetY: 'mt-0',
  },
  {
    quote:
      'Thực phẩm đóng gói cực kỳ xinh xắn, sạch sẽ. Nhìn thôi là đã muốn cho con ăn rồi!',
    cat: '/assets/cat/image 651.png',
    author: 'Bạn Vy & Sữa',
    place: 'Thủ Đức, HCM',
    color: 'bg-[#C8BEE8]',
    dot: 'bg-[#B7720F]',
    tape: 'tape-heart',
    tapePos: 'bottom-6 -right-5 -rotate-[20deg]',
    tilt: '-rotate-[2deg]',
    offsetY: 'mt-6',
  },
];

/* ----------------------------- Helper components ----------------------------- */

function PainCard({ pain }) {
  const Icon = pain.Icon;

  return (
    <div
      className={`min-w-0 rounded-[20px] border-[1.5px] px-5 py-6 md:px-7 md:py-7 ${pain.border} ${pain.bg}`}
    >
      <Icon className={`h-6 w-6 ${pain.iconColor}`} strokeWidth={2.2} />
      <h3 className="mt-3 text-[18px] font-extrabold leading-tight tracking-normal text-[#252020]">
        {pain.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.55] text-[#5C4033]">{pain.desc}</p>
    </div>
  );
}

function MealCard({ product, badge }) {
  const onSale =
    product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const price = onSale ? product.salePrice : product.price;

  return (
    <article className="group mx-auto flex h-full min-h-[548px] w-full max-w-[380px] flex-col rounded-[28px] bg-white p-5 shadow-[0_14px_30px_-18px_rgba(63,42,107,0.28)] transition-transform duration-300 hover:-translate-y-1 sm:p-6">
      <Link
        to={`/san-pham/${product.slug}`}
        className="relative block shrink-0 overflow-hidden rounded-[12px] aspect-square"
      >
        {badge && (
          <span className="absolute left-4 top-4 z-10 rounded-[4px] bg-[#66CC99] px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.03em] text-white">
            {badge}
          </span>
        )}
        <img
          src={product.image || '/assets/paw/Cat Food Kit.png'}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src =
              product.fallbackImage || '/assets/paw/Cat Food Kit.png';
          }}
          className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col pt-6">
        <Link to={`/san-pham/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[56px] text-[22px] font-extrabold leading-[1.25] tracking-normal text-[#252020]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-3 line-clamp-2 min-h-[58px] text-[17px] leading-[1.55] text-[#5C4033]">
          {product.shortDescription || product.description?.slice(0, 80) || ''}
        </p>

        <div
          className="mt-6 border-t border-dashed border-[#D7CCC4]"
          aria-hidden
        />

        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="text-[24px] font-extrabold leading-none text-[#252020]">
            {formatPrice(price)}
          </span>
          <button
            type="button"
            className="flex h-[50px] w-[50px] items-center justify-center rounded-[8px] bg-[#FFCB2E] text-white shadow-[0_4px_0_rgba(63,42,107,0.12)] transition-colors hover:bg-[#FFB800]"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingCart size={23} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productApi
      .list({ limit: 3, sort: 'best_seller' })
      .then((d) => setProducts(d.items || []))
      .catch(() => setProducts([]));
  }, []);

  // Fallback when DB chưa có sản phẩm — vẫn hiển thị 3 thẻ mẫu
  const productVisuals = [
    {
      image: '/assets/paw/Cat Food Kit.png',
    },
    {
      image: '/assets/paw/image 653.png',
    },
    {
      image: '/assets/paw/image 654.png',
    },
  ];

  const display = products.length
    ? products.slice(0, 3).map((product, index) => ({
        ...product,
        image: product.image || productVisuals[index]?.image,
        fallbackImage: productVisuals[index]?.image,
      }))
    : [
        {
          _id: 'a',
          slug: '#',
          name: 'Kit Toàn Diện (Ướt & Khô)',
          shortDescription:
            'Gói Tuần 1.5kg cho mèo trưởng thành (7 gói pate + 1.2kg hạt)',
          price: 450000,
          image: '/assets/paw/Cat Food Kit.png',
          fallbackImage: '/assets/paw/Cat Food Kit.png',
        },
        {
          _id: 'b',
          slug: '#',
          name: 'Kit Mèo Con #01',
          shortDescription:
            'Mix Ướt/Khô – 3 Ngày dành riêng cho hệ tiêu hóa non nớt.',
          price: 220000,
          image: '/assets/paw/image 653.png',
          fallbackImage: '/assets/paw/image 653.png',
        },
        {
          _id: 'c',
          slug: '#',
          name: 'Combo Nhạy Cảm',
          shortDescription:
            'Thực đơn ít gây dị ứng, giàu Omega-3 cho bộ lông mượt mà.',
          price: 510000,
          image: '/assets/paw/image 654.png',
          fallbackImage: '/assets/paw/image 654.png',
        },
      ];

  const badges = ['BÁN CHẠY NHẤT', null, null];

  return (
    <div className="overflow-x-hidden bg-[#FBF7F4]">
      {/* ======================= HERO ======================= */}
      <section className="container-paw py-6 md:py-10">
        <div className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-[#E8DBFB] p-6 md:rounded-[36px] md:p-14 lg:grid-cols-[1.1fr_1fr] lg:p-16">
          <div className="min-w-0">
            <h1 className="crayon text-[48px] leading-[0.95] sm:text-[56px] md:text-[80px] xl:text-[92px]">
              Chăm mèo<br />
              khoa học,<br />
              không còn<br />
              lãng phí.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-7 text-[#3F2A6B] md:mt-7 md:text-[15px]">
              Meal Kit dinh dưỡng được thiết kế riêng bởi AI, giao tận cửa mỗi
              tuần. Ăn đúng, ăn đủ, không lãng phí.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/lien-he-tu-van"
                className="inline-flex items-center justify-center rounded-full bg-[#FFCB2E] hover:bg-[#FFB800] text-[#3F2A6B] font-extrabold px-9 py-4 text-[15px] shadow-[0_8px_0_rgba(63,42,107,0.12)] transition-all hover:-translate-y-0.5"
              >
                Làm Quiz ngay
              </Link>
              <Link
                to="/danh-muc"
                className="inline-flex items-center justify-center rounded-full bg-white hover:bg-[#F8F4FF] text-[#3F2A6B] font-extrabold px-9 py-4 text-[15px] shadow-[0_8px_0_rgba(63,42,107,0.10)] transition-all hover:-translate-y-0.5"
              >
                Xem thực đơn
              </Link>
            </div>
          </div>

          <div className="relative min-w-0 max-w-full">
            {/* Mint offset shadow card */}
            <div
              className="absolute inset-0 translate-x-3 translate-y-4 rounded-[28px] bg-[#9DD8B6]"
              aria-hidden
            />
            {/* Yellow image card */}
            <div className="relative aspect-[1/1] w-full overflow-hidden rounded-[24px] border-4 border-white bg-[#FFCB2E] p-2 shadow-[8px_10px_0_rgba(63,42,107,0.12)] md:aspect-[1.05/1] md:rounded-[28px] md:p-3">
              <img
                src="/assets/cat/Happy Cat User 2.png"
                alt="Mèo Paw World"
                className="w-full h-full object-cover rounded-[20px]"
              />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl bg-white py-3 pl-3 pr-5 shadow-[0_12px_28px_-10px_rgba(63,42,107,0.25)] md:left-8">
              <span className="w-10 h-10 rounded-full bg-[#FFE8D6] flex items-center justify-center text-[#FF924A]">
                <BadgeCheck size={22} strokeWidth={2.4} />
              </span>
              <div>
                <div className="text-[13px] font-extrabold text-[#252020] leading-tight">
                  100% Tự nhiên
                </div>
                <div className="text-[11px] text-[#5C4033] mt-0.5">
                  Chứng nhận bởi chuyên gia
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= PAIN POINTS ======================= */}
      <section className="overflow-hidden bg-[#FBF7F4] py-14 md:py-20">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="text-center">
            <h2 className="crayon mx-auto max-w-[820px] text-[34px] leading-[1.05] md:text-[52px]">
              Nuôi mèo không nên là một cuộc chiến
            </h2>
            <p className="mx-auto mt-3 max-w-[620px] text-[13px] leading-6 text-[#5C4033] md:text-[15px]">
              PawWorld sinh ra để giúp bạn giải quyết những nỗi lo thường trực.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-[1fr_320px_1fr] md:items-stretch md:gap-8">
            {/* Left column */}
            <div className="order-2 grid min-w-0 gap-5 content-start md:order-1 md:gap-6">
              <PainCard pain={PAINS[0]} />
              <PainCard pain={PAINS[1]} />
            </div>

            {/* Center cat image */}
            <div className="order-1 mx-auto h-[326px] w-full max-w-[260px] overflow-hidden rounded-[22px] bg-[#E6DDD1] md:order-2 md:h-full md:min-h-[420px] md:max-w-none md:rounded-[24px]">
              <img
                src="/assets/cat/2.png"
                alt="Mèo tam thể PawWorld"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Right column */}
            <div className="order-3 grid min-w-0 gap-5 content-start md:gap-6">
              <PainCard pain={PAINS[2]} />
              <PainCard pain={PAINS[3]} />
            </div>
          </div>
        </div>
      </section>

      {/* ======================= STEPS 1-2-3 ======================= */}
      <section className="relative overflow-hidden bg-[#FBF7F4] pb-16 pt-2 md:pb-20 md:pt-4">
        <div className="container-paw relative">
          {/* paw decorations */}
          <span
            className="paw-deco hidden md:block absolute left-2 top-2 w-14 h-14 opacity-70"
            aria-hidden
          />
          <span
            className="paw-deco hidden md:block absolute left-4 bottom-4 w-12 h-12 opacity-70"
            aria-hidden
          />

          <h2 className="crayon mx-auto mb-12 max-w-[900px] px-2 text-center text-[34px] leading-[1.05] md:mb-14 md:text-[52px]">
            Quy trình 1-2-3 cho Sen thảnh thơi
          </h2>

          <div className="relative mx-auto max-w-[1000px] px-2 md:px-6">
            {/* dotted line */}
            <div
              className="hidden md:block absolute left-[12%] right-[12%] top-[44px] h-0.5 border-t-2 border-dashed border-[#9C9587]"
              aria-hidden
            />

            <div className="relative grid gap-12 md:grid-cols-3 md:gap-6">
              {STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <div
                    className={`mx-auto w-[88px] h-[88px] rounded-full ${s.color} text-white font-extrabold text-[34px] flex items-center justify-center shadow-[0_8px_0_rgba(63,42,107,0.10)] relative z-10`}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-extrabold text-[20px] mt-7 text-[#252020]">
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-[#5C4033] mt-3 max-w-[300px] mx-auto leading-[1.6]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================= MEAL KIT GRID ======================= */}
      <section className="overflow-hidden bg-[#E8DBFB] py-14 md:py-20">
        <div className="container-paw">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="crayon text-[34px] leading-[1.05] md:text-[52px]">
                Thực đơn sẵn sàng
              </h2>
              <p className="mt-2 text-[14px] text-[#3F2A6B] md:text-[15px]">
                Chọn theo nhu cầu đặc biệt của bé yêu.
              </p>
            </div>
            <Link
              to="/danh-muc"
              className="text-[14px] font-extrabold text-[#3F2A6B] hover:text-[#7B57BD] underline-offset-4 hover:underline"
            >
              Xem tất cả combo
            </Link>
          </div>

          <div className="grid grid-cols-1 justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
            {display.map((p, i) => (
              <MealCard key={p._id} product={p} badge={badges[i]} />
            ))}
          </div>
        </div>
      </section>

      {/* ======================= CSR ======================= */}
      <section className="overflow-hidden bg-[#FBF7F4] py-14 md:py-20">
        <div className="container-paw">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative">
              <div className="rounded-[28px] overflow-hidden aspect-[5/4] bg-[#E6DDD1]">
                <img
                  src="/assets/cat/image 652.png"
                  alt="Quỹ hỗ trợ mèo lang thang"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Heart floating */}
              <div className="absolute -bottom-6 right-10 md:right-20 w-[88px] h-[88px] rounded-full bg-white shadow-[0_10px_28px_-10px_rgba(63,42,107,0.25)] flex items-center justify-center">
                <Heart
                  size={36}
                  className="text-[#FF8E72]"
                  fill="#FFB99E"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="relative">
              <h2 className="crayon text-[32px] leading-[1.1] md:text-[44px]">
                "Mỗi miếng ăn, một sự sẻ chia"
              </h2>
              <p className="mt-5 max-w-[520px] text-[14px] leading-7 text-[#5C4033] md:text-[15px]">
                Tại PawWorld, chúng tôi tin rằng mọi bé mèo đều xứng đáng có một
                bữa ăn ngon. Đó là lý do <strong>[X]%</strong> doanh thu từ mỗi
                đơn hàng sẽ được trích ra để hỗ trợ thực phẩm cho các trạm cứu hộ
                mèo lang thang.
              </p>

              <div className="mt-8 flex flex-wrap gap-10 md:gap-12">
                <div>
                  <div className="font-extrabold text-[34px] text-[#252020]">
                    15k+
                  </div>
                  <div className="text-[13px] text-[#5C4033] mt-1">
                    Bữa ăn quyên góp
                  </div>
                </div>
                <div>
                  <div className="font-extrabold text-[34px] text-[#252020]">
                    12
                  </div>
                  <div className="text-[13px] text-[#5C4033] mt-1">
                    Trạm cứu hộ đồng hành
                  </div>
                </div>
              </div>

              <Link
                to="/gioi-thieu"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#FFCB2E] hover:bg-[#FFB800] text-[#3F2A6B] font-extrabold px-8 py-3.5 text-[14px] shadow-[0_6px_0_rgba(63,42,107,0.12)] transition-all hover:-translate-y-0.5"
              >
                Tìm hiểu thêm về quỹ
              </Link>

              {/* paw decoration */}
              <span
                className="paw-deco hidden md:block absolute right-2 -bottom-2 w-12 h-12 opacity-70"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================= TESTIMONIALS ======================= */}
      <section className="overflow-hidden bg-[#FBF7F4] pb-20 pt-10 md:pb-24 md:pt-12">
        <div className="container-paw">
          <h2 className="crayon mx-auto max-w-[900px] text-center text-[34px] leading-[1.05] md:text-[52px]">
            Chia sẻ từ cộng đồng PawWorld
          </h2>

          <div className="mt-12 grid gap-8 px-2 md:mt-14 md:grid-cols-3 md:px-6 lg:gap-12">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`relative ${t.offsetY} ${t.tilt} transition-transform duration-300 hover:-translate-y-1`}
              >
                <div
                  className={`relative rounded-[24px] ${t.color} p-5 pb-6 shadow-[8px_10px_0_rgba(63,42,107,0.12)]`}
                >
                  {/* Washi tape */}
                  <span
                    className={`tape-washi ${t.tape} absolute h-7 w-28 ${t.tapePos} z-10`}
                    aria-hidden
                  />

                  {/* Photo polaroid */}
                  <div className="rounded-[14px] overflow-hidden bg-white aspect-[4/3.4]">
                    <img
                      src={t.cat}
                      alt={t.author}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Quote */}
                  <p className="mt-5 text-[#252020] text-[14px] leading-[1.6]">
                    "{t.quote}"
                  </p>

                  {/* Divider */}
                  <div className="mt-4 h-px bg-[#252020]/40" />

                  {/* Author */}
                  <div className="mt-3 flex items-start gap-2.5">
                    <span
                      className={`mt-1 w-3.5 h-3.5 rounded-full ${t.dot} shrink-0`}
                      aria-hidden
                    />
                    <div className="leading-tight">
                      <div className="font-extrabold text-[15px] text-[#252020]">
                        {t.author}
                      </div>
                      <div className="text-[12px] text-[#5C4033] mt-1">
                        {t.place}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
