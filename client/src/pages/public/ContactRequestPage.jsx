import {
  ArrowRight,
  CircleHelp,
  Mail,
  MapPin,
  Search,
  Share2,
  ShoppingBasket,
  Sparkles,
  Truck,
} from 'lucide-react';

const supportCategories = [
  {
    title: 'HƯỚNG DẪN MUA HÀNG',
    description: 'Cách thức đặt Meal Kit và các bước để bắt đầu hành trình dinh dưỡng cho bé.',
    Icon: ShoppingBasket,
    cardClass: 'bg-[#FFE6A6] md:rotate-[-1deg]',
    iconClass: 'bg-[#FFCB2E] text-[#5C4033]',
  },
  {
    title: 'GIAO HÀNG & ĐỔI TRẢ',
    description:
      'Chính sách vận chuyển, phí ship và quy trình hoàn trả hàng nếu Sen không hài lòng.',
    Icon: Truck,
    cardClass: 'bg-[#F8D8E5] md:rotate-[1deg]',
    iconClass: 'bg-[#EE9FBD] text-white',
  },
  {
    title: 'CÂU HỎI THƯỜNG GẶP',
    description: 'Giải đáp các thắc mắc phổ biến nhất về sản phẩm và dịch vụ của chúng mình.',
    Icon: CircleHelp,
    cardClass: 'bg-[#DDF0D7] md:rotate-[-2deg]',
    iconClass: 'bg-[#72C99F] text-white',
  },
];

const featuredQuestions = [
  'Làm sao để bảo quản Meal Kit tươi đúng cách?',
  'Thời gian giao hàng dự kiến tại khu vực TP.HCM?',
  'Bé mèo bị dị ứng thì có Meal Kit riêng không?',
  'Chính sách bảo mật thông tin khách hàng',
];

const contactBlocks = [
  {
    label: 'ĐỊA CHỈ',
    value: 'Đại học FPT Hà Nội',
    Icon: MapPin,
    iconClass: 'bg-[#FFCB2E] text-[#5C4033]',
  },
  {
    label: 'EMAIL',
    value: 'support@pawworld.vn',
    Icon: Mail,
    iconClass: 'bg-[#EE9FBD] text-white',
  },
  {
    label: 'KẾT NỐI',
    value: 'Facebook Instagram TikTok',
    Icon: Share2,
    iconClass: 'bg-[#BFC4F2] text-[#3F2A6B]',
  },
];

export default function ContactRequestPage() {
  return (
    <div className="-mb-16 overflow-hidden bg-[#FBF7F4] text-[#252020]">
      <section className="relative bg-[#ECEAF7]">
        <img
          src="/assets/icon/khac/pets.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 bottom-5 w-[160px] opacity-55 sm:w-[210px] md:left-10 md:bottom-10 lg:left-20"
        />
        <img
          src="/assets/icon/khac/Decorative accents.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-10 hidden w-[180px] opacity-70 md:block lg:right-20 lg:w-[230px]"
        />

        <div className="container-paw relative z-10 flex min-h-[390px] flex-col items-center justify-center px-4 py-16 text-center md:min-h-[460px] md:py-20">
          <h1 className="crayon max-w-full text-[36px] leading-[0.95] tracking-normal text-[#39105E] sm:text-[50px] md:max-w-[980px] md:text-[76px] lg:text-[92px]">
            <span className="block md:inline">CHÚNG MÌNH</span>{' '}
            <span className="block md:inline">GIÚP</span>{' '}
            <span className="block">ĐƯỢC GÌ NÈ?</span>
          </h1>
          <p className="mt-6 max-w-[680px] text-[16px] font-semibold leading-7 text-[#5C4033] md:text-[18px]">
            Tìm kiếm lời khuyên và câu trả lời từ đội ngũ hỗ trợ PawWorld một cách nhanh
            nhất.
          </p>

          <form
            className="mt-9 flex w-full max-w-[680px] items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-[0_18px_35px_-24px_rgba(63,42,107,0.45)] md:px-6 md:py-4"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={24} strokeWidth={2.6} className="shrink-0 text-[#F0A33A]" />
            <input
              aria-label="Tìm kiếm hỗ trợ"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-bold text-[#252020] outline-none placeholder:text-[#A89F93] md:text-[17px]"
              placeholder="Tìm câu trả lời cho bé mèo của bạn..."
            />
          </form>
        </div>
      </section>

      <section className="bg-[#FBF7F4] py-16 md:py-20">
        <div className="container-paw px-4">
          <h2 className="crayon text-center text-[34px] leading-none tracking-normal text-[#39105E] md:text-[54px]">
            <span className="block md:inline">DANH MỤC</span>{' '}
            <span className="block md:inline">HỖ TRỢ</span>
          </h2>

          <div className="mx-auto mt-10 grid max-w-[980px] gap-5 md:grid-cols-3 md:gap-7">
            {supportCategories.map(({ title, description, Icon, cardClass, iconClass }) => (
              <article
                key={title}
                className={`${cardClass} flex min-h-[245px] flex-col items-center justify-center rounded-[18px] border-[3px] border-white px-6 py-8 text-center shadow-[8px_10px_0_rgba(63,42,107,0.10)]`}
              >
                <span
                  className={`${iconClass} flex h-16 w-16 items-center justify-center rounded-full shadow-[0_6px_0_rgba(63,42,107,0.12)]`}
                >
                  <Icon size={30} strokeWidth={2.4} />
                </span>
                <h3 className="mt-6 text-[17px] font-black leading-snug text-[#252020]">
                  {title}
                </h3>
                <p className="mt-3 text-[14px] font-semibold leading-6 text-[#5C4033]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[#FBF7F4] px-4 pb-20 md:pb-28">
        <div
          id="faq"
          className="relative mx-auto max-w-[870px] rounded-[22px] border border-white bg-white px-5 pb-4 pt-12 shadow-[0_28px_65px_-42px_rgba(63,42,107,0.55)] md:px-8 md:pb-6 md:pt-14"
        >
          <img
            src="/assets/icon/khac/OBJECTS.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-4 -top-14 w-[126px] rotate-[-8deg] md:-left-10 md:w-[165px]"
          />

          <h2 className="flex items-center justify-center gap-3 text-center text-[22px] font-black text-[#39105E] md:text-[28px]">
            <Sparkles size={24} strokeWidth={2.5} className="text-[#F0A33A]" />
            CÂU HỎI NỔI BẬT
          </h2>

          <div className="mt-6">
            {featuredQuestions.map((question) => (
              <button
                key={question}
                type="button"
                className="group flex min-h-[68px] w-full items-center justify-between gap-4 border-b border-dashed border-[#D7CFC4] py-4 text-left text-[15px] font-extrabold leading-snug text-[#252020] transition-colors last:border-b-0 hover:text-[#3F2A6B] md:text-[17px]"
              >
                <span>{question}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBF7F4] text-[#A89F93] transition-colors group-hover:bg-[#FFCB2E] group-hover:text-[#3F2A6B]">
                  <ArrowRight size={20} strokeWidth={2.4} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FFF1CF] px-4 py-16 md:py-20">
        <div className="container-paw text-center">
          <div className="mx-auto w-[164px] rotate-[-2deg] rounded-[18px] border-[8px] border-white bg-white shadow-[7px_9px_0_rgba(63,42,107,0.10)] md:w-[194px]">
            <img
              src="/assets/cat/image 154.png"
              alt="Mèo PawWorld sẵn sàng hỗ trợ"
              className="aspect-[1.05] w-full rounded-[10px] object-cover"
            />
          </div>

          <h2 className="crayon mt-8 text-[33px] leading-none tracking-normal text-[#39105E] md:text-[56px]">
            <span className="block">CHƯA TÌM THẤY</span>
            <span className="block">CÂU TRẢ LỜI?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[720px] text-[16px] font-semibold leading-7 text-[#5C4033] md:text-[18px]">
            Chuyên viên tư vấn dinh dưỡng của chúng mình luôn sẵn sàng lắng nghe và giải
            đáp mọi thắc mắc của bạn qua chat trực tuyến hoặc hotline.
          </p>

          <a
            href="mailto:support@pawworld.vn"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#3F2A6B] px-8 py-3 text-[14px] font-black text-white shadow-[0_7px_0_rgba(63,42,107,0.18)] transition-transform hover:-translate-y-0.5 md:text-[15px]"
          >
            CHAT VỚI CHUYÊN VIÊN
          </a>

          <div className="mx-auto mt-12 grid max-w-[940px] gap-5 md:grid-cols-3">
            {contactBlocks.map(({ label, value, Icon, iconClass }) => (
              <div
                key={label}
                className="flex min-h-[130px] flex-col items-center justify-center px-4 text-center"
              >
                <span
                  className={`${iconClass} flex h-14 w-14 items-center justify-center rounded-full shadow-[0_6px_0_rgba(63,42,107,0.10)]`}
                >
                  <Icon size={25} strokeWidth={2.5} />
                </span>
                <span className="mt-4 block text-[12px] font-black text-[#A37B41]">
                  {label}
                </span>
                <span className="mt-1 block text-[15px] font-extrabold leading-6 text-[#252020]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
