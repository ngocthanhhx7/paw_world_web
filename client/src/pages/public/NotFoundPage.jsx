import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-paw py-20 text-center">
      <img src="/assets/cat/image 168.png" alt="" className="w-44 mx-auto" />
      <h1 className="font-display text-5xl mt-3 text-cocoa-700">Meow… không thấy trang này</h1>
      <p className="text-cocoa-400 mt-2">
        Có vẻ như boss đã giấu mất trang bạn muốn xem. Hãy quay lại trang chủ nhé.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Về trang chủ
      </Link>
    </div>
  );
}
