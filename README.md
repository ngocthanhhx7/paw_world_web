# 🐾 Paw World — Web bán đồ ăn cho mèo

Monorepo gồm:

```
paw_world_web/
├── client/                  # Frontend React (Vite + TailwindCSS + React Router)
├── server/                  # Backend Node.js (Express + MongoDB/Mongoose + JWT)
├── Tai_nnguyen_chuan_bi/    # Asset gốc (font, logo, hình mèo, icon, brand-scrolling)
└── package.json             # Root workspaces (client + server)
```

## 1. Yêu cầu môi trường

- Node.js ≥ 18
- MongoDB ≥ 6 (chạy local trên `mongodb://127.0.0.1:27017`)
- npm ≥ 9 (đã hỗ trợ npm workspaces)

## 2. Cài đặt nhanh

```bash
# 1. Cài đặt toàn bộ workspace (root + client + server)
npm run install:all

# 2. Tạo file env cho server
copy server\.env.example server\.env   # Windows
# cp server/.env.example server/.env   # macOS/Linux

# 3. Khởi tạo dữ liệu mẫu (sản phẩm, danh mục, tài khoản admin)
npm run seed

# 4. Chạy đồng thời cả backend + frontend
npm run dev
```

Mặc định:

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Frontend (Vite) | http://localhost:5173              |
| Backend API   | http://localhost:5000/api          |
| Admin login   | http://localhost:5173/admin/login  |

Tài khoản admin mặc định (sau khi seed):

```
email:    admin@pawworld.vn
password: pawworld@123
```

## 3. Tài khoản & luồng truy cập admin

Khách hàng **không cần đăng nhập** vẫn mua được hàng — giỏ hàng được lưu theo `localStorage` + cookie phiên (`paw_cart_id`).

Để vào trang quản trị:

1. Vào trực tiếp `http://localhost:5173/admin/login`
2. Đăng nhập với tài khoản admin (mặc định ở trên hoặc tự seed thêm)
3. Sau khi đăng nhập, được redirect tới `/admin/dashboard` gồm:
   - **Tổng quan** — thống kê đơn hàng, doanh thu, lượt xem sản phẩm
   - **Sản phẩm** — CRUD sản phẩm, upload ảnh, gắn danh mục
   - **Danh mục** — CRUD category
   - **Đơn hàng** — danh sách order + đổi trạng thái
   - **Khách hàng cần liên hệ** — danh sách khách bấm "Để lại thông tin liên hệ" để được tư vấn

## 4. Tech stack

### Frontend (`client/`)

- React 18 + Vite
- React Router v6
- TailwindCSS (+ font `FC-DK-Cool-Crayon` cho heading)
- Zustand (state nhẹ cho giỏ hàng + auth admin)
- Axios (gọi API)
- React Hot Toast (thông báo)
- Lucide React (icon bổ sung)

### Backend (`server/`)

- Express 4
- Mongoose (MongoDB)
- JWT + bcryptjs (auth admin)
- Multer (upload ảnh sản phẩm)
- cookie-parser, cors, helmet, morgan
- dotenv

## 5. Cấu trúc thư mục chi tiết

```
client/
├── public/
├── src/
│   ├── api/                # axios instance + endpoint cụ thể
│   ├── assets/             # copy từ Tai_nnguyen_chuan_bi
│   ├── components/         # Header, Footer, ProductCard, Button, ...
│   ├── context/            # CartContext
│   ├── hooks/
│   ├── layouts/            # MainLayout, AdminLayout
│   ├── pages/
│   │   ├── public/         # Home, About, Category, ProductDetail, Cart, Checkout, ContactRequest
│   │   └── admin/          # Login, Dashboard, Products, Categories, Orders, Leads
│   ├── store/              # zustand stores
│   ├── styles/             # tailwind.css + biến màu
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
└── tailwind.config.js

server/
├── src/
│   ├── config/             # db.js, env.js
│   ├── controllers/
│   ├── middlewares/        # auth, error, upload
│   ├── models/             # Product, Category, Order, Lead, Admin, Cart
│   ├── routes/             # public + admin
│   ├── services/
│   ├── utils/
│   ├── seeds/              # seedDatabase.js
│   └── app.js
├── uploads/                # ảnh upload (gitignore)
└── server.js
```

## 6. Mapping Figma → Code

| Trang | Node Figma | Component |
| ----- | ---------- | --------- |
| Header | `66:5449` | `client/src/components/layout/Header.jsx` |
| Footer | `66:5104` | `client/src/components/layout/Footer.jsx` |
| Home | `39:2383` | `client/src/pages/public/HomePage.jsx` |
| About | `58:4239` | `client/src/pages/public/AboutPage.jsx` |
| Product Detail | `69:5817` | `client/src/pages/public/ProductDetailPage.jsx` |
| Category / Listing | `82:4554` | `client/src/pages/public/CategoryPage.jsx` |

## 7. Roadmap mở rộng (sau MVP)

- Tích hợp thanh toán (VNPay/MoMo sandbox)
- Tích hợp chat tư vấn (Tawk.to)
- Đa ngôn ngữ (i18n)
- Đánh giá sản phẩm + review có ảnh
- Admin upload ảnh lên Cloudinary thay vì local
