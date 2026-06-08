import { useState } from 'react';
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
  X,
} from 'lucide-react';

const supportCategories = [
  {
    id: 'buying',
    title: 'HƯỚNG DẪN MUA HÀNG',
    description: 'Cách thức đặt Meal Kit và các bước để bắt đầu hành trình dinh dưỡng cho bé.',
    Icon: ShoppingBasket,
    cardClass: 'bg-[#FFE6A6] md:rotate-[-1deg]',
    iconClass: 'bg-[#FFCB2E] text-[#5C4033]',
  },
  {
    id: 'shipping',
    title: 'GIAO HÀNG & ĐỔI TRẢ',
    description:
      'Chính sách vận chuyển, phí ship và quy trình hoàn trả hàng nếu Sen không hài lòng.',
    Icon: Truck,
    cardClass: 'bg-[#F8D8E5] md:rotate-[1deg]',
    iconClass: 'bg-[#EE9FBD] text-white',
  },
  {
    id: 'faq',
    title: 'CÂU HỎI THƯỜNG GẶP',
    description: 'Giải đáp các thắc mắc phổ biến nhất về sản phẩm và dịch vụ của chúng mình.',
    Icon: CircleHelp,
    cardClass: 'bg-[#DDF0D7] md:rotate-[-2deg]',
    iconClass: 'bg-[#72C99F] text-white',
  },
];

const featuredQuestions = [
  {
    q: 'Làm sao để bảo quản Meal Kit tươi đúng cách?',
    a: (
      <div className="space-y-4 text-[#5C4033] mt-3 pb-3 text-[14px] md:text-[15px] font-semibold leading-relaxed">
        <p>
          Meal Kit của PawWorld được đóng gói theo từng khẩu phần nhằm đảm bảo độ tươi và tiện lợi trong quá trình sử dụng. Sau đây là cách bảo quản giúp cho gói meal kit giữ được chất lượng hiệu quả nhất:
        </p>
        <div className="space-y-4 pl-3.5 border-l-[3px] border-[#FFCB2E]">
          <div>
            <strong className="text-[#39105E] block font-black text-[15px] md:text-[16px]">Mini Kit - Theo ngày</strong>
            <p className="mt-1 text-xs md:text-sm font-semibold">Bảo quản nơi khô ráo, thoáng mát. Sau khi mở nắp pate hoặc thức ăn ướt, nên bảo quản trong nhiệt độ lạnh và dùng cho bé mèo trong vòng 24 giờ.</p>
          </div>
          <div>
            <strong className="text-[#39105E] block font-black text-[15px] md:text-[16px]">Weekly Kit - Theo tuần</strong>
            <p className="mt-1 text-xs md:text-sm font-semibold">Bảo quản các sản phẩm tươi trong ngăn mát tủ lạnh. Chia khẩu phần theo ngày để giữ độ tươi và hạn chế lãng phí hoặc dùng quá nhiều lượng đồ ăn cho bé mèo trong 1 ngày.</p>
          </div>
          <div>
            <strong className="text-[#39105E] block font-black text-[15px] md:text-[16px]">Monthly Kit - Theo tháng</strong>
            <p className="mt-1 text-xs md:text-sm font-semibold">Ưu tiên bảo quản theo từng nhóm sản phẩm trong kit vì kit bao gồm nhiều loại sản phẩm khô, ướt kết hợp. Thức ăn khô để nơi kín, tránh ẩm; pate và sản phẩm tươi nên giữ lạnh sau khi mở. Có thể chia nhỏ theo tuần để tiện sử dụng và đảm bảo chất lượng tốt nhất cho mèo.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    q: 'Thời gian giao hàng dự kiến tại khu vực TP.HCM?',
    a: (
      <div className="space-y-3 text-[#5C4033] mt-3 pb-3 text-[14px] md:text-[15px] font-semibold leading-relaxed">
        <p>
          Thời gian giao hàng dự kiến tại Thành phố Hồ Chí Minh có thể kéo dài từ <strong>1 - 3 ngày làm việc</strong> tùy khu vực, khung giờ đặt hàng và tùy theo loại gói sản phẩm Meal kit.
        </p>
        <p>
          Với các đơn hàng Weekly Kit và Monthly Kit, PawWorld ưu tiên đóng gói theo lịch định kỳ để đảm bảo sản phẩm luôn tươi mới khi đến tay thú cưng của bạn. Nếu gặp phải vấn đề khiến cho quá trình giao hàng bị trì hoãn và vượt quá thời hạn giao hàng dự kiến, khách hàng sẽ được hỗ trợ bồi thường hoặc nhận được sản phẩm đổi mới theo chính sách chăm sóc của PawWorld.
        </p>
      </div>
    ),
  },
  {
    q: 'Bé mèo bị dị ứng thì có Meal Kit riêng không?',
    a: (
      <div className="space-y-3 text-[#5C4033] mt-3 pb-3 text-[14px] md:text-[15px] font-semibold leading-relaxed">
        <p>
          PawWorld có thể hỗ trợ các meal kit dành riêng cho mèo có cơ địa nhạy cảm hoặc dị ứng thực phẩm. Thực đơn ăn của bé mèo còn phụ thuộc vào loại thực phẩm mà bé bị dị ứng, chế độ ăn kiêng được đề xuất bởi bác sĩ thú y có chuyên môn sẽ hiệu quả nhất.
        </p>
        <p>
          Tuy nhiên hệ thống của PawWorld sẽ ưu tiên loại bỏ các nguyên liệu dễ gây kích ứng như hải sản, sữa hoặc một số loại protein động vật nhất định, ưu tiên chế độ ăn protein thủy phân và đồng thời ứng dụng trợ lý AI để gợi ý khẩu phần phù hợp hơn với nhu cầu dinh dưỡng của mèo dựa trên những bữa ăn trước đó. Khách hàng cũng có thể ghi chú tình trạng dị ứng khi đặt hàng để meal kit được cá nhân hóa an toàn và dễ theo dõi hơn trong quá trình sử dụng.
        </p>
      </div>
    ),
  },
  {
    q: 'Chính sách bảo mật thông tin khách hàng',
    a: (
      <div className="space-y-3 text-[#5C4033] mt-3 pb-3 text-[14px] md:text-[15px] font-semibold leading-relaxed">
        <p>
          PawWorld xin cam kết bảo mật toàn bộ thông tin cá nhân của khách hàng, bao gồm họ tên, số điện thoại, địa chỉ giao hàng và thông tin thanh toán trong suốt quá trình sử dụng dịch vụ. Dữ liệu chỉ được sử dụng nhằm mục đích xử lý đơn hàng, các dịch vụ chăm sóc khách hàng và cải thiện trải nghiệm sử dụng meal kit cho thú cưng.
        </p>
        <p>
          PawWorld không chia sẻ, trao đổi hay mua bán thông tin khách hàng cho bên thứ ba khi chưa có sự đồng ý. Mọi thông tin đều được lưu trữ và bảo vệ theo quy trình bảo mật nhằm đảm bảo an toàn và quyền riêng tư cho mỗi khách hàng.
        </p>
        <div className="rounded-[16px] bg-[#FFF9EC] p-4 border border-[#FFE7B3] text-[#3F2A6B] flex gap-2 items-start mt-3">
          <span className="text-[18px] select-none">🐾</span>
          <p className="text-[13px] font-bold leading-relaxed">
            Cảm ơn bạn đã đồng hành cùng PawWorld trong hành trình chăm sóc thú cưng tốt hơn mỗi ngày. Mỗi Meal kit mà khách hàng ủng hộ sẽ góp phần hỗ trợ các trạm cứu hộ chó mèo hoang, góp phần mang đến nhiều bữa ăn và sự chăm sóc chu đáo hơn cho những bé thú cưng đang cần sự giúp đỡ.
          </p>
        </div>
      </div>
    ),
  },
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
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const buyingContent = (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-[#F0EBE6]">
        <h3 className="crayon text-[28px] text-[#39105E]">Hướng dẫn mua hàng</h3>
        <p className="text-[#5C4033] text-sm mt-1 font-semibold">Quy trình cực kỳ đơn giản để bắt đầu bữa ăn ngon lành cho mèo yêu</p>
      </div>
      
      <div className="space-y-6 mt-6">
        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFCB2E] text-[#5C4033] font-black text-lg shadow-[0_4px_0_rgba(255,203,46,0.25)]">
            1
          </div>
          <div className="space-y-1">
            <h4 className="text-[16px] font-black text-[#39105E]">Làm quen với AI của tụi mình</h4>
            <p className="text-[14px] font-semibold leading-relaxed text-[#5C4033]">
              Hãy dành 60s kể cho AI nghe về bé mèo của bạn (tên, tuổi, thể trạng...). Đây là bước quan trọng nhất để có một thực đơn chuẩn chỉnh.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFCB2E] text-[#5C4033] font-black text-lg shadow-[0_4px_0_rgba(255,203,46,0.25)]">
            2
          </div>
          <div className="space-y-1">
            <h4 className="text-[16px] font-black text-[#39105E]">Chọn giải pháp phù hợp</h4>
            <p className="text-[14px] font-semibold leading-relaxed text-[#5C4033]">
              Bạn có thể chọn mua lẻ theo ngày để bé thử vị, hoặc chọn Meal Kit (3 ngày/7 ngày) để PawWorld chia sẵn khẩu phần, giúp bạn tiết kiệm thời gian và tránh lãng phí.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFCB2E] text-[#5C4033] font-black text-lg shadow-[0_4px_0_rgba(255,203,46,0.25)]">
            4
          </div>
          <div className="space-y-1">
            <h4 className="text-[16px] font-black text-[#39105E]">Thanh toán & Chờ đợi</h4>
            <p className="text-[14px] font-semibold leading-relaxed text-[#5C4033]">
              PawWorld hỗ trợ các phương thức thanh toán hiện đại nhất. Sau khi xác nhận, Kit của bé sẽ được đóng gói và giao đến tay bạn sớm nhất.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const shippingContent = (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-[#F0EBE6]">
        <h3 className="crayon text-[28px] text-[#39105E]">Giao hàng & Đổi trả</h3>
        <p className="text-[#5C4033] text-sm mt-1 font-semibold">Chính sách giao nhận, bảo đảm chất lượng và bảo vệ quyền lợi của Sen</p>
      </div>

      <div className="space-y-6 overflow-y-auto pr-1 max-h-[55vh]">
        <div className="bg-[#FFF6F9] rounded-[18px] p-5 border border-[#FCD4E2]">
          <h4 className="text-[16px] font-black text-[#EE9FBD] flex items-center gap-2">
            <span>🚚</span> 2.1. Thời gian giao hàng
          </h4>
          <div className="mt-3 text-[14px] font-semibold text-[#5C4033] space-y-2">
            <p>• <strong>Nội thành:</strong> Giao nhanh trong <strong>2h-4h</strong> để đảm bảo chất lượng pate tươi.</p>
            <p>• <strong>Các khu vực khác:</strong> Từ <strong>1-3 ngày</strong> tùy đơn vị vận chuyển.</p>
            <p>• <strong>Phí vận chuyển:</strong> Đồng giá <strong>25k</strong> hoặc <strong>miễn phí</strong> cho các gói Meal Kit từ 7 ngày trở lên.</p>
          </div>
        </div>

        <div className="bg-[#FFFBEB] rounded-[18px] p-5 border border-[#FFE89E]">
          <h4 className="text-[16px] font-black text-[#F0A33A] flex items-center gap-2">
            <span>✅</span> 2.2. Chính sách đổi trả (Miễn phí 100%)
          </h4>
          <p className="mt-2 text-xs font-bold text-[#A37B41]">Các trường hợp PawWorld hỗ trợ đổi trả:</p>
          <div className="mt-2.5 text-[14px] font-semibold text-[#5C4033] space-y-2.5 pl-1">
            <p>• <strong>Lỗi do vận chuyển:</strong> Bao bì bị rách, móp méo nặng, xì nắp pate làm ảnh hưởng đến chất lượng bên trong.</p>
            <p>• <strong>Lỗi hệ thống:</strong> Giao sai loại Kit, sai món lẻ hoặc thiếu số lượng so với đơn hàng.</p>
            <p>• <strong>Lỗi chất lượng:</strong> Sản phẩm hết hạn sử dụng hoặc có dấu hiệu hư hỏng dù vẫn còn nguyên seal (trong điều kiện bảo quản đúng).</p>
            <p className="mt-3 text-[13px] bg-white rounded-lg p-2.5 border border-[#FFECAE] text-[#3F2A6B]">
              <strong>Quy trình:</strong> Bạn vui lòng chụp ảnh/quay phim lỗi sản phẩm và inbox cho tụi mình trong vòng <strong>24h</strong> kể từ khi nhận hàng để được xử lý nhanh nhất.
            </p>
          </div>
        </div>

        <div className="bg-[#FFF5F5] rounded-[18px] p-5 border border-[#FED7D7]">
          <h4 className="text-[16px] font-black text-[#E53E3E] flex items-center gap-2">
            <span>❌</span> 2.3. Các trường hợp từ chối đổi trả
          </h4>
          <p className="mt-2 text-xs font-bold text-[#C53030]">Để đảm bảo an toàn vệ sinh thực phẩm cho tất cả các bé mèo và duy trì chi phí tốt nhất cho cộng đồng, PawWorld từ chối đổi trả đối với:</p>
          <div className="mt-2.5 text-[14px] font-semibold text-[#5C4033] space-y-2 pl-1">
            <p>• <strong>Bé không hợp khẩu vị:</strong> Mèo là loài có sở thích ăn uống cá nhân và thay đổi thất thường. Tụi mình không thể kiểm soát sở thích của từng bé.</p>
            <p>• <strong>Đổi ý sau khi nhận hàng:</strong> Khách hàng thay đổi nhu cầu nhưng sản phẩm không có lỗi từ phía nhà sản xuất.</p>
            <p>• <strong>Bảo quản sai cách:</strong> Sản phẩm bị hỏng do khách để ở nơi ẩm ướt, nắng nóng hoặc không làm theo hướng dẫn bảo quản.</p>
            <p>• Sản phẩm đã mở bao bì hoặc có dấu hiệu bị cạy mở.</p>
          </div>
        </div>

        <div className="bg-[#F4F2FC] rounded-[18px] p-5 border border-[#E2DCF7]">
          <h4 className="text-[16px] font-black text-[#3F2A6B] flex items-center gap-2">
            <span>🔄</span> 2.4. Hình thức và Quy trình đổi trả
          </h4>
          <div className="mt-3 text-[14px] font-semibold text-[#5C4033] space-y-3 pl-1">
            <p><strong>Bước 1: Chụp ảnh/Quay phim</strong><br />Bạn chỉ cần chụp lại tình trạng sản phẩm (chỗ bị lỗi) kèm theo mã đơn hàng.</p>
            <p><strong>Bước 2: Inbox cho tụi mình</strong><br />Gửi ảnh qua Zalo/Facebook/Instagram. Tụi mình sẽ phản hồi ngay trong vòng <strong>2 tiếng</strong> (giờ hành chính).</p>
            <p><strong>Bước 3: Lựa chọn hình thức giải quyết</strong><br />
              • <em>Đổi kit mới:</em> Tụi mình sẽ gửi shipper mang vị pate mới đến và thu hồi vị cũ về. (Miễn phí ship nếu lỗi do tụi mình).<br />
              • <em>Hoàn tiền mặt:</em> Hoàn tiền qua chuyển khoản ngân hàng/Momo trong vòng <strong>24h</strong> sau khi tụi mình nhận lại hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const faqContent = (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-[#F0EBE6]">
        <h3 className="crayon text-[28px] text-[#39105E]">Lời khuyên tránh lãng phí</h3>
        <p className="text-[#5C4033] text-sm mt-1 font-semibold">Vì giá trị cốt lõi "Không lãng phí" của cộng đồng PawWorld 🐾</p>
      </div>

      <div className="space-y-5 text-[14px] md:text-[15px] font-semibold text-[#5C4033] leading-relaxed">
        <p className="italic text-[#3F2A6B] text-center bg-[#F4F2FC] p-3 rounded-xl border border-[#E2DCF7]">
          Nếu đây là lần đầu bạn mua hàng hoặc bé mèo của bạn khá kén ăn, tụi mình đề xuất:
        </p>

        <div className="space-y-4">
          <div className="flex gap-3 items-start p-4 rounded-[16px] bg-[#FFF9EC] border border-[#FFE7B3]">
            <span className="text-xl">🐱</span>
            <div>
              <h4 className="font-black text-[#39105E] text-[15px]">Hãy bắt đầu với Gói dùng thử 3 ngày</h4>
              <p className="mt-1 text-sm font-semibold text-[#5C4033]">Thay vì mua ngay Gói tháng, gói 3 ngày là lựa chọn an toàn để kiểm tra phản ứng của bé.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-4 rounded-[16px] bg-[#DDF0D7] border border-[#C3E6BB]">
            <span className="text-xl">🍽️</span>
            <div>
              <h4 className="font-black text-[#39105E] text-[15px]">Kinh nghiệm "dụ" bé</h4>
              <p className="mt-1 text-sm font-semibold text-[#5C4033]">Đôi khi bé chỉ cần thời gian để làm quen với vị mới. Bạn hãy thử trộn một ít thức ăn cũ vào sản phẩm mới trong những ngày đầu nhé.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-4 rounded-[16px] bg-[#FFF1CF] border border-[#FFE3A1]">
            <span className="text-xl">❤️</span>
            <div>
              <h4 className="font-black text-[#39105E] text-[15px]">Chia sẻ thay vì bỏ đi</h4>
              <p className="mt-1 text-sm font-semibold text-[#5C4033]">Nếu bé thực sự từ chối, đừng vội vứt bỏ! Hãy dành tặng phần ăn đó cho các bé mèo của hàng xóm hoặc các bạn mèo hoang gần nhà. Một món đồ bé nhà mình không thích có thể là bữa tiệc thịnh soạn của một bạn mèo khác đó! 🐾</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <span className="sr-only">CHÚNG MÌNH GIÚP ĐƯỢC GÌ NÈ?</span>
            <span aria-hidden="true" className="block md:inline">CHÚNG MÌNH</span>{' '}
            <span aria-hidden="true" className="block md:inline">GIÚP</span>{' '}
            <span aria-hidden="true" className="block">ĐƯỢC GÌ NÈ?</span>
          </h1>
          <p className="mt-6 max-w-[330px] text-[16px] font-semibold leading-7 text-[#5C4033] md:max-w-[680px] md:text-[18px]">
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
            <span className="sr-only">DANH MỤC HỖ TRỢ</span>
            <span aria-hidden="true" className="block md:inline">
              DANH MỤC
            </span>{' '}
            <span aria-hidden="true" className="block md:inline">
              HỖ TRỢ
            </span>
          </h2>

          <div className="mx-auto mt-10 grid max-w-[340px] gap-5 md:max-w-[980px] md:grid-cols-3 md:gap-7">
            {supportCategories.map(({ id, title, description, Icon, cardClass, iconClass }) => (
              <button
                key={title}
                onClick={() => setSelectedCategory(id)}
                className={`${cardClass} flex min-h-[245px] flex-col items-center justify-center rounded-[18px] border-[3px] border-white px-6 py-8 text-center shadow-[8px_10px_0_rgba(63,42,107,0.10)] hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full text-[#252020]`}
              >
                <span
                  className={`${iconClass} flex h-16 w-16 items-center justify-center rounded-full shadow-[0_6px_0_rgba(63,42,107,0.12)]`}
                >
                  <Icon size={30} strokeWidth={2.4} />
                </span>
                <h3 className="mt-6 text-[17px] font-black leading-snug text-[#252020]">
                  {title}
                </h3>
                <p className="mt-3 max-w-[260px] text-[13px] font-semibold leading-6 text-[#5C4033] md:text-[14px]">
                  {description}
                </p>
              </button>
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
            {featuredQuestions.map(({ q, a }, idx) => {
              const isOpen = activeQuestion === idx;
              return (
                <div key={q} className="border-b border-dashed border-[#D7CFC4] last:border-b-0 py-4">
                  <button
                    type="button"
                    onClick={() => setActiveQuestion(isOpen ? null : idx)}
                    className="group flex w-full items-center justify-between gap-4 text-left text-[15px] font-extrabold leading-snug text-[#252020] transition-colors hover:text-[#3F2A6B] md:text-[17px]"
                  >
                    <span>{q}</span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBF7F4] text-[#A89F93] transition-all duration-300 ${isOpen ? 'bg-[#FFCB2E] text-[#3F2A6B] rotate-90' : 'group-hover:bg-[#FFCB2E] group-hover:text-[#3F2A6B]'}`}>
                      <ArrowRight size={20} strokeWidth={2.4} />
                    </span>
                  </button>
                  
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      {a}
                    </div>
                  </div>
                </div>
              );
            })}
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
            <span className="sr-only">CHƯA TÌM THẤY CÂU TRẢ LỜI?</span>
            <span aria-hidden="true" className="block">
              CHƯA TÌM THẤY
            </span>
            <span aria-hidden="true" className="block">
              CÂU TRẢ LỜI?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[280px] text-[16px] font-semibold leading-7 text-[#5C4033] sm:max-w-[330px] md:max-w-[720px] md:text-[18px]">
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

      {/* Modal */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="relative w-full max-w-[680px] rounded-[24px] border-[3px] border-white bg-white p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#8A7A71] hover:bg-[#FBF7F4] hover:text-[#39105E] transition-colors"
              aria-label="Đóng"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            
            {selectedCategory === 'buying' && buyingContent}
            {selectedCategory === 'shipping' && shippingContent}
            {selectedCategory === 'faq' && faqContent}
          </div>
        </div>
      )}
    </div>
  );
}
