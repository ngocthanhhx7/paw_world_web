import { PawPrint } from 'lucide-react';

const founderPaws = [
  { name: 'LAN ANH', src: '/assets/icon/khac/Group 1321314349.svg' },
  { name: 'NGỌC LINH', src: '/assets/icon/khac/Group 1321314350.svg' },
  { name: 'THÙY LINH', src: '/assets/icon/khac/Group 1321314351.svg' },
  { name: 'ANH THƯ', src: '/assets/icon/khac/Group 1321314352.svg' },
  { name: 'PHƯƠNG THẢO', src: '/assets/icon/khac/Group 1321314353.svg' },
];

const brandTags = [
  { label: 'Me-O', className: 'bg-[#C9C9F4] text-white' },
  { label: 'SmartHeart', className: 'bg-[#FBC333] text-white' },
  { label: 'Doca', className: 'bg-[#C9C9F4] text-white' },
  { label: 'KitCat', className: 'bg-[#FBC333] text-white' },
  { label: 'Nature Bridge', className: 'bg-[#C9C9F4] text-white' },
  { label: 'New Hope', className: 'bg-[#FBC333] text-white' },
  { label: 'Unicharm', className: 'bg-[#C9C9F4] text-white' },
  { label: 'ZIWI', className: 'bg-[#FBC333] text-white' },
];

function SectionCopy({ children, className = '' }) {
  return <div className={`space-y-6 text-[15px] leading-7 ${className}`}>{children}</div>;
}

export default function AboutPage() {
  return (
    <div className="-mb-16 bg-white text-[#2C143B]">
      <section className="overflow-hidden bg-white">
        <div className="container-paw grid min-h-[590px] items-center gap-12 py-16 lg:grid-cols-[1.03fr_0.97fr] lg:py-20">
          <div className="relative order-2 mx-auto h-[330px] w-full max-w-[620px] sm:h-[420px] lg:order-1 lg:h-[455px]">
            <img
              src="/assets/cat/image 168.png"
              alt="Nhóm mèo PawWorld"
              className="absolute left-[12%] top-4 w-[80%] max-w-[560px] drop-shadow-[0_18px_8px_rgba(0,0,0,0.16)]"
            />
            <img
              src="/assets/cat/image 154.png"
              alt="Mèo trắng PawWorld"
              className="absolute bottom-3 left-0 w-[44%] min-w-[210px] max-w-[320px] drop-shadow-[0_12px_6px_rgba(0,0,0,0.2)] sm:bottom-0"
            />
          </div>

          <div className="order-1 mx-auto max-w-[500px] text-center lg:order-2 lg:ml-auto lg:mr-0 lg:text-right">
            <h1 className="text-6xl leading-[0.88] tracking-normal text-[#39105E] md:text-[82px]">
              Về
              <br />
              PawWorld
            </h1>
            <p className="mt-9 text-[15px] leading-7 text-[#2D2430]">
              PawWorld là dự án được xây dựng từ tình yêu dành cho động vật, đặc biệt là mèo, và từ
              thực trạng hiện nay vẫn còn rất nhiều chú mèo bị bỏ rơi, thiếu thốn ăn hoặc không được
              chăm sóc đúng cách. Trong khi đó, nhiều người nuôi thú cưng lại gặp khó khăn trong việc
              lựa chọn thực phẩm phù hợp do thiếu thời gian và kiến thức, dẫn đến tình trạng mua sai,
              mua dư thừa hoặc gây lãng phí thức ăn.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#75CCA4] text-white">
        <div className="container-paw grid min-h-[320px] items-start gap-8 py-16 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] lg:py-20">
          <h2 className="text-5xl leading-none tracking-normal text-white md:text-[54px]">
            GIÁ TRỊ
          </h2>
          <SectionCopy className="max-w-[780px]">
            <p>
              PawWorld được xây dựng từ tình yêu dành cho động vật và mong muốn giúp việc chăm sóc thú
              cưng trở nên dễ dàng, đúng cách và hạn chế lãng phí hơn.
            </p>
            <p>
              Chúng mình nhận thấy nhiều người nuôi thú cưng gặp khó khăn khi lựa chọn thức ăn phù
              hợp, trong khi vẫn còn nhiều chó mèo bị bỏ rơi hoặc chưa được chăm sóc đầy đủ. Vì vậy,
              PawWorld hướng đến việc tạo ra các bộ kit dinh dưỡng được sắp xếp sẵn theo nhu cầu của
              từng bé mèo, giúp người nuôi tiết kiệm thời gian và giảm tình trạng mua sai hoặc mua dư.
            </p>
          </SectionCopy>
        </div>
      </section>

      <section
        className="bg-[#C9D8F1] bg-cover bg-center text-[#39105E]"
        style={{ backgroundImage: "url('/assets/Backgrounds/Frame 1321314346.png')" }}
      >
        <div className="container-paw grid min-h-[320px] items-start gap-8 py-16 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] lg:py-20">
          <h2 className="text-5xl leading-none tracking-normal text-[#39105E] md:text-[54px]">
            MỤC TIÊU
          </h2>
          <SectionCopy className="max-w-[760px] text-[#2B1745]">
            <p>
              PawWorld hướng đến xây dựng một nền tảng gợi ý và cung cấp kit dinh dưỡng cho mèo, giúp
              việc chăm sóc trở nên tiện lợi và phù hợp hơn với từng nhu cầu cụ thể.
            </p>
            <p>
              Đồng thời, PawWorld mong muốn lan tỏa sự quan tâm đến chó mèo bị bỏ rơi thông qua nội
              dung cộng đồng và việc trích một phần doanh thu để hỗ trợ các trạm cứu hộ cũng như các bé
              mèo ngoài cộng đồng.
            </p>
          </SectionCopy>
        </div>
      </section>

      <section className="bg-white pt-20">
        <h2 className="px-4 text-center text-5xl leading-none tracking-normal text-[#252020] md:text-[56px]">
          GẶP GỠ NGƯỜI SÁNG LẬP
        </h2>

        <div className="mt-20 bg-[#FFF9D8]">
          <div className="container-paw grid grid-cols-2 justify-items-center gap-x-8 gap-y-10 py-12 sm:grid-cols-3 lg:grid-cols-5 lg:py-14">
            {founderPaws.map((founder) => (
              <img
                key={founder.name}
                src={founder.src}
                alt={founder.name}
                className="h-[190px] w-auto sm:h-[225px] lg:h-[282px]"
              />
            ))}
          </div>
        </div>

        <div className="container-paw grid grid-cols-2 justify-items-center gap-x-8 gap-y-6 py-10 sm:grid-cols-3 lg:grid-cols-5">
          {founderPaws.map((founder) => (
            <p key={founder.name} className="text-sm font-extrabold text-[#32104D]">
              {founder.name}
            </p>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-20 lg:py-28">
        <PawPrint
          className="absolute left-[8%] top-[22%] hidden text-[#CFCFCF] md:block"
          size={74}
          strokeWidth={0}
          fill="currentColor"
          aria-hidden="true"
        />
        <PawPrint
          className="absolute left-[49%] top-[14%] hidden text-[#CFCFCF] lg:block"
          size={62}
          strokeWidth={0}
          fill="currentColor"
          aria-hidden="true"
        />

        <div className="container-paw grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex justify-center lg:justify-start">
            <img
              src="/assets/paw/cfc3d7f844b024807049920fc1a7bb55 1.png"
              alt="Bát thức ăn dinh dưỡng PawWorld"
              className="w-full max-w-[590px]"
            />
          </div>

          <div className="mx-auto max-w-[470px] lg:mx-0">
            <h2 className="text-5xl leading-[0.9] tracking-normal text-[#39105E] md:text-[58px]">
              Khoa học
              <br />
              dinh dưỡng
            </h2>
            <div className="mt-8 text-[15px] leading-7 text-[#231F20]">
              <p>
                PawWorld phát triển sản phẩm dựa trên các nguyên tắc dinh dưỡng phù hợp với đặc điểm
                sinh học của mèo - loài động vật ăn thịt bắt buộc. Chúng tôi ưu tiên:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Hàm lượng protein động vật phù hợp</li>
                <li>Thiết kế khẩu phần ăn theo từng giai đoạn phát triển của bé mèo</li>
                <li>Cân bằng giữa thức ăn khô và ướt</li>
                <li>Hạn chế các lựa chọn gây mất cân bằng dinh dưỡng</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-20">
        <div className="container-paw">
          <h2 className="text-center text-4xl leading-tight tracking-normal text-[#252020] md:text-[52px]">
            Các thương hiệu mà Paw World đồng hành
          </h2>
        </div>
        <div className="mt-8 grid w-full grid-cols-2 gap-[2px] overflow-hidden sm:grid-cols-4 lg:grid-cols-8">
          {brandTags.map((brand) => (
            <div
              key={brand.label}
              className={`flex h-12 items-center justify-center px-3 text-center text-base font-extrabold ${brand.className}`}
            >
              {brand.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
