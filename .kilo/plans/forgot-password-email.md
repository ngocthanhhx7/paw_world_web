# Plan: Hoàn thiện luồng quên mật khẩu (gửi email)

## Tổng trạng thái

Luồng quên mật khẩu đã hoàn chỉnh về code ở cả frontend và backend, **ngoại trừ khâu gửi email thực tế**. Khi chạy production, controller `customerForgotPassword` chỉ trả về message chung chứ không gửi email reset link cho user.

Ở chế độ development (`NODE_ENV !== 'production'`), API trả về `resetUrl` trong response để test được flow mà không cần email — behavior này cần giữ nguyên.

## Những việc cần làm

### 1. Cài đặt nodemailer
- Cài package `nodemailer` vào `server/package.json`

### 2. Tạo file cấu hình email `server/src/config/mail.js`
- Đọc các biến môi trường: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
- Tạo và export transporter (pooled, secure tùy port)
- Export hàm `sendMail(options)` wrapper

### 3. Cập nhật `server/.env.example` — thêm block cấu hình email
```
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=PawWorld <your-email@gmail.com>
CLIENT_RESET_PASSWORD_URL=https://pawworldvn.shop/dat-lai-mat-khau
```

### 4. Sửa controller `customerForgotPassword` trong `server/src/controllers/auth.controller.js`
Thay đoạn production (line 241-243) để gửi email thay vì chỉ trả về message:

```
// Trong production: gửi email
const resetLink = `${process.env.CLIENT_RESET_PASSWORD_URL}/${token}`;
await sendMail({
  to: customer.email,
  subject: 'Đặt lại mật khẩu PawWorld',
  html: `<p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Liên kết có hiệu lực trong 30 phút.</p>`,
});
return res.json(response);
```

- Dev mode (line 239-241) giữ nguyên: vẫn trả `resetUrl` trong response.
- Nếu `SMTP_HOST` chưa được cấu hình (undefined), fallback về behavior cũ (chỉ trả message) + log cảnh báo ra console, tránh crash.

### 5. Cập nhật test nếu cần
- Test hiện tại (`customerAuth.controller.test.js:289-326`) chạy với `NODE_ENV=test` nên vẫn đi vào nhánh dev → không cần sửa test.
- Mock `sendMail` nếu cần test nhánh production.

## Các file sẽ thay đổi / tạo mới

| File | Hành động |
|------|-----------|
| `server/package.json` | Thêm `nodemailer` vào dependencies |
| `server/.env.example` | Thêm block SMTP/email config |
| `server/src/config/mail.js` | **Tạo mới** — transporter + sendMail |
| `server/src/controllers/auth.controller.js` | Sửa `customerForgotPassword` gọi `sendMail` ở production |

## Không động đến

- Frontend (ForgotPasswordPage, ResetPasswordPage, store, routes): đã hoàn chỉnh
- Model Customer: đã hoàn chỉnh
- Route auth.routes.js: đã hoàn chỉnh  
- Middleware: đã hoàn chỉnh
- Các controller, service khác: không liên quan

## Lưu ý

- Không đọc `.env` trên server thật — chỉ thêm mẫu vào `.env.example`
- Giữ nguyên behavior dev mode (trả `resetUrl` trong response để test)
- Fallback an toàn: nếu SMTP chưa cấu hình thì log warning + chỉ trả message, không crash
