# Meow Quizz Customer Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full customer authentication flow, server-backed pet profiles, Meow Quizz wizard, and AI meal recommendation path while matching the provided Figma screens.

**Architecture:** Keep admin auth separate. Add customer auth under `/api/auth/customer/*`, customer-owned pet profiles under `/api/customer/pet-profiles/*`, and a dedicated React public flow for login/register/reset, Meow Quizz, profile management, recommendation, and checkout handoff. UI work must be verified by browser screenshots against the Figma/chat screenshots before completion.

**Tech Stack:** React 18, Vite, TailwindCSS, Zustand, React Router, Axios, Express, MongoDB/Mongoose, bcryptjs, jsonwebtoken, node:test, ShineShop OpenAI-compatible chat completions.

---

## Design Fidelity Rule

The user explicitly requires the implemented screens to match the Figma designs. Figma MCP access currently fails for `ZXvooYYpNEvzz2AR7sf8R6` with access errors, so implementation must use this order of visual sources:

1. Figma MCP context/screenshots if access becomes available.
2. The screenshots already provided in the conversation.
3. Existing PawWorld assets in `client/public/assets`, `client/public/fonts`, and the current header at `http://localhost:5173/`.

Every UI task has a browser screenshot gate. Do not call a UI task complete until desktop and mobile screenshots are reviewed for:

- Header dimensions and icon placement.
- Lavender background and pale paw decorations.
- White auth/quiz cards, rounded corners, yellow primary buttons, and crayon headings.
- No text overflow, clipping, or incoherent overlap.
- Header logged-out and logged-in dropdown states.

## File Structure

### Backend Files

- Create: `server/src/models/Customer.js`
  - Customer account schema, password hashing, password comparison, reset token helpers.
- Create: `server/src/models/PetProfile.js`
  - Customer-owned pet profile schema and latest AI recommendation snapshot.
- Modify: `server/src/middlewares/auth.js`
  - Keep `requireAdmin`; add `requireCustomer`.
- Modify: `server/src/controllers/auth.controller.js`
  - Keep admin auth exports; add customer auth exports.
- Modify: `server/src/routes/auth.routes.js`
  - Register `/customer/register`, `/customer/login`, `/customer/me`, `/customer/logout`, `/customer/forgot-password`, `/customer/reset-password`.
- Create: `server/src/services/meowRecommendation.service.js`
  - Product catalog normalization, fallback products, prompt construction, deterministic fallback.
- Create: `server/src/controllers/petProfile.controller.js`
  - CRUD and recommendation endpoint.
- Create: `server/src/routes/petProfile.routes.js`
  - Customer-protected pet profile routes.
- Modify: `server/src/app.js`
  - Mount `/api/customer/pet-profiles`.
- Test/Create: `server/src/controllers/customerAuth.controller.test.js`
- Test/Create: `server/src/controllers/petProfile.controller.test.js`
- Test/Create: `server/src/services/meowRecommendation.service.test.js`

### Frontend Files

- Modify: `client/src/api/client.js`
  - Attach admin bearer token only for admin token. Customer auth relies on cookie.
- Modify: `client/src/api/endpoints.js`
  - Add `customerAuthApi`, `petProfileApi`.
- Create: `client/src/store/customerAuthStore.js`
  - Customer state and auth actions.
- Modify: `client/src/App.jsx`
  - Add customer auth init and public routes.
- Modify: `client/src/components/layout/Header.jsx`
  - Correct quiz link, add customer icon behavior/dropdown.
- Modify: `client/src/components/layout/Footer.jsx`
  - Point Meow Quizz links to `/meow-quizz`.
- Modify: `client/src/pages/public/HomePage.jsx`
  - Point `Lam Quiz ngay` to `/meow-quizz`.
- Create: `client/src/pages/public/auth/AuthShell.jsx`
  - Shared Figma auth shell.
- Create: `client/src/pages/public/auth/LoginPage.jsx`
- Create: `client/src/pages/public/auth/RegisterPage.jsx`
- Create: `client/src/pages/public/auth/ForgotPasswordPage.jsx`
- Create: `client/src/pages/public/auth/ResetPasswordPage.jsx`
- Create: `client/src/pages/public/meowQuizz/meowQuizData.js`
  - Step config, labels, enum values, defaults.
- Create: `client/src/pages/public/meowQuizz/MeowQuizPage.jsx`
  - Wizard UI.
- Create: `client/src/pages/public/meowQuizz/PetProfilesPage.jsx`
  - Profile list/delete modal.
- Create: `client/src/pages/public/meowQuizz/PetProfileEditPage.jsx`
  - Edit profile form.
- Create: `client/src/pages/public/meowQuizz/RecommendationPage.jsx`
  - AI result and checkout handoff.
- Create: `client/src/pages/public/meowQuizz/meowRecommendationFallback.js`
  - Client display fallback only, not authoritative backend logic.

---

## Task 1: Figma Access And Visual Baseline

**Files:**
- Reference: `docs/superpowers/specs/2026-06-08-meow-quizz-customer-auth-design.md`
- No runtime code changes.

- [ ] **Step 1: Try to fetch Figma auth context**

Use the Figma MCP tool for these node IDs:

```text
384:13512
379:10312
381:10842
381:11149
384:12999
381:11555
```

Expected: either screenshots/design context are available, or the same access error is confirmed.

- [ ] **Step 2: Try to fetch Figma quiz context**

Use the Figma MCP tool for the quiz node IDs listed in the spec/user request, starting with:

```text
356:3468
360:4188
356:3873
360:4396
360:4682
363:4953
365:5136
365:5222
365:5569
365:5675
365:5802
372:6117
372:6317
372:6762
372:6942
375:7044
375:7134
375:7448
376:8976
376:10116
382:11954
384:12332
```

Expected: either screenshots/design context are available, or the access error is confirmed.

- [ ] **Step 3: Capture current home header baseline**

Run:

```bash
npm run dev
```

Open `http://localhost:5173/` and capture desktop and mobile screenshots with Chrome DevTools or the browser screenshot tool.

Expected: current public header is visible and includes logo, nav, search, cart, and user icon positions.

- [ ] **Step 4: Commit visual baseline notes**

If Figma access remains blocked, add a short note to the implementation PR/change summary:

```text
Figma API access was unavailable, so UI parity was implemented from the provided screenshots and verified with browser screenshots.
```

Do not commit runtime code in this task.

---

## Task 2: Customer Auth Backend

**Files:**
- Create: `server/src/models/Customer.js`
- Modify: `server/src/middlewares/auth.js`
- Modify: `server/src/controllers/auth.controller.js`
- Modify: `server/src/routes/auth.routes.js`
- Test: `server/src/controllers/customerAuth.controller.test.js`

- [ ] **Step 1: Write customer auth tests**

Create `server/src/controllers/customerAuth.controller.test.js` with node:test coverage for pure controller helpers and route behavior using mocked request/response objects:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const crypto = require('crypto');

const Customer = require('../models/Customer');

test('Customer hashes password and comparePassword accepts the original password', async () => {
  const customer = new Customer({
    fullName: 'Nguyen Con Sen',
    email: 'sen@example.com',
    password: '12345678',
  });

  await customer.validate();
  await customer.save();

  assert.notEqual(customer.password, '12345678');
  assert.equal(await customer.comparePassword('12345678'), true);
  assert.equal(await customer.comparePassword('wrong-password'), false);

  await Customer.deleteOne({ email: 'sen@example.com' });
});

test('Customer reset token helper stores only a hash', async () => {
  const customer = new Customer({
    fullName: 'Reset User',
    email: 'reset@example.com',
    password: '12345678',
  });

  const token = customer.createPasswordResetToken();
  assert.equal(typeof token, 'string');
  assert.equal(token.length > 20, true);
  assert.notEqual(customer.resetPasswordTokenHash, token);
  assert.equal(
    customer.resetPasswordTokenHash,
    crypto.createHash('sha256').update(token).digest('hex'),
  );
  assert.ok(customer.resetPasswordExpiresAt instanceof Date);
});
```

Run:

```bash
npm run test -w server
```

Expected: FAIL because `Customer` does not exist.

- [ ] **Step 2: Add Customer model**

Create `server/src/models/Customer.js`:

```js
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email khong hop le'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    resetPasswordTokenHash: { type: String, default: '' },
    resetPasswordExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

customerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

customerSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

customerSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordTokenHash = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  return token;
};

customerSchema.methods.clearPasswordResetToken = function clearPasswordResetToken() {
  this.resetPasswordTokenHash = '';
  this.resetPasswordExpiresAt = null;
};

module.exports = mongoose.model('Customer', customerSchema);
```

Run:

```bash
npm run test -w server
```

Expected: model tests pass if test DB connection is available; otherwise note DB dependency and continue to controller unit tests.

- [ ] **Step 3: Extend auth middleware**

Modify `server/src/middlewares/auth.js` to keep `requireAdmin` and add `requireCustomer`:

```js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = tokenFromHeader || req.cookies?.paw_admin_token;

    if (!token) {
      return res.status(401).json({ message: 'Ban can dang nhap voi tai khoan admin' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Tai khoan admin khong ton tai hoac da bi khoa' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
  }
}

async function requireCustomer(req, res, next) {
  try {
    const token = req.cookies?.paw_customer_token;
    if (!token) {
      return res.status(401).json({ message: 'Ban can dang nhap de tiep tuc' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer || !customer.isActive) {
      return res.status(401).json({ message: 'Tai khoan khong ton tai hoac da bi khoa' });
    }

    req.customer = customer;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
  }
}

module.exports = { requireAdmin, requireCustomer };
```

- [ ] **Step 4: Add customer auth controller exports**

Modify `server/src/controllers/auth.controller.js`. Keep existing admin exports and add:

```js
const crypto = require('crypto');
const Customer = require('../models/Customer');

function signCustomerToken(customer) {
  return jwt.sign({ id: customer._id, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function customerPayload(customer) {
  return {
    id: customer._id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || '',
    avatar: customer.avatar || '',
  };
}

function setCustomerCookie(res, token) {
  res.cookie('paw_customer_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

exports.customerRegister = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui long nhap ho ten, email va mat khau' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Customer.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email nay da duoc dang ky' });
  }

  const customer = await Customer.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
  });
  const token = signCustomerToken(customer);
  setCustomerCookie(res, token);
  res.status(201).json({ customer: customerPayload(customer) });
};

exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui long nhap email va mat khau' });
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!customer || !customer.isActive) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  const ok = await customer.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  customer.lastLoginAt = new Date();
  await customer.save();
  const token = signCustomerToken(customer);
  setCustomerCookie(res, token);
  res.json({ customer: customerPayload(customer) });
};

exports.customerMe = async (req, res) => {
  res.json({ customer: customerPayload(req.customer) });
};

exports.customerLogout = async (req, res) => {
  res.clearCookie('paw_customer_token');
  res.json({ message: 'Da dang xuat' });
};

exports.customerForgotPassword = async (req, res) => {
  const { email } = req.body;
  const response = { message: 'Neu email ton tai, PawWorld se gui huong dan dat lai mat khau' };
  if (!email) return res.json(response);

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
  if (!customer) return res.json(response);

  const token = customer.createPasswordResetToken();
  await customer.save();
  if (process.env.NODE_ENV !== 'production') {
    return res.json({ ...response, resetUrl: `/dat-lai-mat-khau/${token}` });
  }
  return res.json(response);
};

exports.customerResetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Thieu token hoac mat khau moi' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const customer = await Customer.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password');

  if (!customer) {
    return res.status(400).json({ message: 'Lien ket dat lai mat khau khong hop le hoac da het han' });
  }

  customer.password = password;
  customer.clearPasswordResetToken();
  await customer.save();
  res.json({ message: 'Da cap nhat mat khau' });
};
```

- [ ] **Step 5: Add customer auth routes**

Modify `server/src/routes/auth.routes.js`:

```js
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAdmin, requireCustomer } = require('../middlewares/auth');

router.post('/admin/login', ctrl.login);
router.get('/admin/me', requireAdmin, ctrl.me);
router.post('/admin/logout', ctrl.logout);

router.post('/customer/register', ctrl.customerRegister);
router.post('/customer/login', ctrl.customerLogin);
router.get('/customer/me', requireCustomer, ctrl.customerMe);
router.post('/customer/logout', ctrl.customerLogout);
router.post('/customer/forgot-password', ctrl.customerForgotPassword);
router.post('/customer/reset-password', ctrl.customerResetPassword);

module.exports = router;
```

- [ ] **Step 6: Run backend tests and commit**

Run:

```bash
npm run test -w server
```

Expected: existing chatbot tests still pass and customer auth tests pass.

Commit:

```bash
git add server/src/models/Customer.js server/src/middlewares/auth.js server/src/controllers/auth.controller.js server/src/routes/auth.routes.js server/src/controllers/customerAuth.controller.test.js
git commit -m "feat: add customer authentication backend"
```

---

## Task 3: Customer Auth Frontend And Figma Auth Screens

**Files:**
- Modify: `client/src/api/client.js`
- Modify: `client/src/api/endpoints.js`
- Create: `client/src/store/customerAuthStore.js`
- Create: `client/src/pages/public/auth/AuthShell.jsx`
- Create: `client/src/pages/public/auth/LoginPage.jsx`
- Create: `client/src/pages/public/auth/RegisterPage.jsx`
- Create: `client/src/pages/public/auth/ForgotPasswordPage.jsx`
- Create: `client/src/pages/public/auth/ResetPasswordPage.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add customer auth API methods**

Modify `client/src/api/endpoints.js`:

```js
export const customerAuthApi = {
  register: (payload) => api.post('/auth/customer/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/customer/login', payload).then((r) => r.data),
  me: () => api.get('/auth/customer/me').then((r) => r.data),
  logout: () => api.post('/auth/customer/logout').then((r) => r.data),
  forgotPassword: (payload) =>
    api.post('/auth/customer/forgot-password', payload).then((r) => r.data),
  resetPassword: (payload) =>
    api.post('/auth/customer/reset-password', payload).then((r) => r.data),
};
```

- [ ] **Step 2: Keep customer token cookie-only**

Modify `client/src/api/client.js` request interceptor to only attach admin localStorage token:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paw_admin_token');
  if (token && window.location.pathname.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Expected: customer auth uses `withCredentials: true` and no customer token is stored in localStorage.

- [ ] **Step 3: Add customer auth store**

Create `client/src/store/customerAuthStore.js`:

```js
import { create } from 'zustand';
import { customerAuthApi } from '@/api/endpoints';

export const useCustomerAuthStore = create((set) => ({
  customer: null,
  ready: false,
  loading: false,

  init: async () => {
    set({ loading: true });
    try {
      const data = await customerAuthApi.me();
      set({ customer: data.customer, ready: true });
    } catch {
      set({ customer: null, ready: true });
    } finally {
      set({ loading: false });
    }
  },

  register: async (payload) => {
    const data = await customerAuthApi.register(payload);
    set({ customer: data.customer, ready: true });
    return data.customer;
  },

  login: async (payload) => {
    const data = await customerAuthApi.login(payload);
    set({ customer: data.customer, ready: true });
    return data.customer;
  },

  logout: async () => {
    try {
      await customerAuthApi.logout();
    } catch {
      /* ignore */
    }
    set({ customer: null, ready: true });
  },

  forgotPassword: (payload) => customerAuthApi.forgotPassword(payload),
  resetPassword: (payload) => customerAuthApi.resetPassword(payload),
}));
```

- [ ] **Step 4: Create Figma auth shell**

Create `client/src/pages/public/auth/AuthShell.jsx`:

```jsx
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User } from 'lucide-react';

const nav = [
  { to: '/meow-quizz', label: 'MEOW QUIZZ' },
  { to: '/gioi-thieu', label: 'VE CHUNG TOI' },
  { to: '/danh-muc', label: 'SHOP MEAL KIT' },
  { to: '/lien-he-tu-van', label: 'LIEN HE' },
];

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-[#EDD8FF]">
      <header className="h-[74px] border-b border-[#eee8f5] bg-white">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-8">
          <Link to="/" className="flex items-center">
            <img src="/assets/logo/ngang.png" alt="PawWorld" className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-10 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#252020] transition hover:text-[#FFB800]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 text-[#161616]">
            <Link to="/dang-nhap" aria-label="Tai khoan">
              <User size={19} strokeWidth={2.2} />
            </Link>
            <button type="button" aria-label="Tim kiem">
              <Search size={19} strokeWidth={2.2} />
            </button>
            <Link to="/gio-hang" aria-label="Gio hang">
              <ShoppingCart size={19} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-[calc(100vh-74px)] overflow-hidden px-4 py-10">
        <span className="paw-deco absolute left-8 top-28 h-40 w-40 opacity-40" aria-hidden />
        <span className="paw-deco absolute bottom-20 right-10 h-36 w-36 opacity-35" aria-hidden />
        <div className="relative mx-auto w-full max-w-[430px]">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Implement login page**

Create `client/src/pages/public/auth/LoginPage.jsx` using the auth shell and Figma structure:

```jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import AuthShell from './AuthShell';
import { useCustomerAuthStore } from '@/store/customerAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useCustomerAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirect = params.get('redirect') || '/';

  const socialSoon = () => toast('Tinh nang dang phat trien');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
      toast.success('Dang nhap thanh cong');
      navigate(redirect, { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Dang nhap that bai');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <form
        onSubmit={handleSubmit}
        className="relative rounded-[12px] bg-white px-10 pb-10 pt-8 shadow-[0_18px_40px_-24px_rgba(63,42,107,0.3)]"
      >
        <span className="absolute -left-8 -top-8 h-20 w-28 rotate-[-35deg] rounded-[4px] bg-[#80748E]" />
        <span className="absolute -bottom-8 right-[-34px] h-20 w-28 rotate-[-35deg] rounded-[4px] bg-[#FFD3C8]" />
        <h1 className="crayon text-center text-[44px] leading-[0.9] text-[#252020]">
          Chao mung<br />tro lai
        </h1>

        <label className="mt-8 block text-[10px] font-extrabold uppercase text-[#252020]">
          Dia chi email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="hello@pawworld.com"
          className="mt-2 h-12 w-full rounded-[10px] bg-[#DDF3EA] px-4 text-sm outline-none placeholder:text-[#8FA99C]"
        />

        <div className="mt-5 flex items-center justify-between">
          <label className="text-[10px] font-extrabold uppercase text-[#252020]">Mat khau</label>
          <Link to="/quen-mat-khau" className="text-[11px] font-extrabold text-[#B35F1D] underline">
            Quen mat khau?
          </Link>
        </div>
        <div className="relative mt-2">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-12 w-full rounded-[10px] bg-[#DDF3EA] px-4 pr-11 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#252020]"
            aria-label={showPassword ? 'An mat khau' : 'Hien mat khau'}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 h-12 w-full rounded-full bg-[#FFCB2E] text-[12px] font-extrabold uppercase text-[#252020] transition hover:bg-[#FFB800] disabled:opacity-60"
        >
          {submitting ? 'Dang dang nhap...' : 'Dang nhap'}
        </button>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#252020]" />
          <span className="text-[10px] font-bold uppercase text-[#252020]">Tiep tuc voi</span>
          <span className="h-px flex-1 bg-[#252020]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={socialSoon} className="h-11 rounded-[9px] border border-[#252020] text-[11px] font-extrabold uppercase">
            Google
          </button>
          <button type="button" onClick={socialSoon} className="h-11 rounded-[9px] border border-[#252020] text-[11px] font-extrabold uppercase">
            Facebook
          </button>
        </div>

        <p className="mt-7 text-center text-[12px] text-[#5C4033]">
          Ban chua co tai khoan?{' '}
          <Link to={`/dang-ky?redirect=${encodeURIComponent(redirect)}`} className="font-extrabold uppercase text-[#B35F1D] underline">
            Dang ky
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
```

- [ ] **Step 6: Implement register, forgot, reset pages**

Create the three remaining auth pages using the same `AuthShell`, same card structure, same social button stub, and these form fields:

```text
Register: fullName, email, password
Forgot: email
Reset: password, confirmPassword
```

Behavior:

```text
Register success -> toast success -> redirect param or /meow-quizz
Forgot success -> show generic success and dev resetUrl if returned
Reset success -> toast success -> /dang-nhap
Social click -> toast "Tinh nang dang phat trien"
```

- [ ] **Step 7: Add public auth routes and init customer state**

Modify `client/src/App.jsx`:

```jsx
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import LoginPage from '@/pages/public/auth/LoginPage';
import RegisterPage from '@/pages/public/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/public/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/auth/ResetPasswordPage';
```

Inside `App`:

```jsx
const initCustomerAuth = useCustomerAuthStore((s) => s.init);

useEffect(() => {
  fetchCart();
  initAuth();
  initCustomerAuth();
}, [fetchCart, initAuth, initCustomerAuth]);
```

Routes inside `MainLayout`:

```jsx
<Route path="/dang-nhap" element={<LoginPage />} />
<Route path="/dang-ky" element={<RegisterPage />} />
<Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
<Route path="/dat-lai-mat-khau/:token" element={<ResetPasswordPage />} />
```

- [ ] **Step 8: Visual QA auth pages**

Run:

```bash
npm run build -w client
```

Expected: build succeeds.

Open:

```text
http://localhost:5173/dang-nhap
http://localhost:5173/dang-ky
http://localhost:5173/quen-mat-khau
```

Capture desktop `1280x800` and mobile `390x844` screenshots. Compare against Figma/chat screenshots. Fix spacing, card width, header height, typography, and button dimensions until the screens are visually aligned.

- [ ] **Step 9: Commit auth frontend**

Run:

```bash
git add client/src/api/client.js client/src/api/endpoints.js client/src/store/customerAuthStore.js client/src/pages/public/auth client/src/App.jsx
git commit -m "feat: add customer auth frontend flow"
```

---

## Task 4: Header Integration And Link Corrections

**Files:**
- Modify: `client/src/components/layout/Header.jsx`
- Modify: `client/src/components/layout/Footer.jsx`
- Modify: `client/src/pages/public/HomePage.jsx`

- [ ] **Step 1: Update header nav targets**

Modify `NAV_ITEMS` in `Header.jsx`:

```js
const NAV_ITEMS = [
  { to: '/meow-quizz', label: 'MEOW QUIZZ' },
  { to: '/gioi-thieu', label: 'VE CHUNG TOI' },
  { to: '/danh-muc', label: 'SHOP MEAL KIT' },
  { to: '/lien-he-tu-van', label: 'LIEN HE' },
];
```

- [ ] **Step 2: Add customer dropdown behavior**

Use `useCustomerAuthStore`, `useRef`, and `useEffect` in `Header.jsx`. Add a user icon button before search/cart:

```jsx
const customer = useCustomerAuthStore((s) => s.customer);
const logoutCustomer = useCustomerAuthStore((s) => s.logout);
const [accountOpen, setAccountOpen] = useState(false);
const accountRef = useRef(null);
```

Logged-out click:

```jsx
if (!customer) navigate('/dang-nhap');
```

Logged-in dropdown items:

```jsx
<Link to="/meow-quizz/ho-so">Ho so thu cung</Link>
<Link to="/tra-cuu-don-hang">Don hang cua toi</Link>
<button type="button" onClick={handleCustomerLogout}>Dang xuat</button>
```

Style dropdown to match Figma:

```text
width 260px, white background, rounded 14px, shadow, anchored under user icon, item height about 48px, small line icons.
```

- [ ] **Step 3: Update HomePage quiz CTA**

Change the hero CTA in `HomePage.jsx`:

```jsx
to="/meow-quizz"
```

- [ ] **Step 4: Update footer quiz links**

Change `Footer.jsx` Meow Quizz and Meal Kit personalized links to `/meow-quizz`.

- [ ] **Step 5: Visual QA header states**

Verify:

```text
Logged out: user icon routes to /dang-nhap.
Logged in: user icon opens dropdown.
Dropdown layout matches Figma screenshot.
Mobile header still works.
```

Run:

```bash
npm run build -w client
```

Expected: build succeeds.

- [ ] **Step 6: Commit header integration**

```bash
git add client/src/components/layout/Header.jsx client/src/components/layout/Footer.jsx client/src/pages/public/HomePage.jsx
git commit -m "feat: connect customer account header"
```

---

## Task 5: Pet Profile Backend

**Files:**
- Create: `server/src/models/PetProfile.js`
- Create: `server/src/controllers/petProfile.controller.js`
- Create: `server/src/routes/petProfile.routes.js`
- Modify: `server/src/app.js`
- Test: `server/src/controllers/petProfile.controller.test.js`

- [ ] **Step 1: Write ownership tests**

Create tests that assert helper query scoping uses both `_id` and `customer`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const { buildOwnedProfileQuery } = require('./petProfile.controller');

test('buildOwnedProfileQuery scopes profile id to customer id', () => {
  const query = buildOwnedProfileQuery('profile-id', 'customer-id');
  assert.deepEqual(query, { _id: 'profile-id', customer: 'customer-id' });
});
```

Run:

```bash
npm run test -w server
```

Expected: FAIL because controller does not exist.

- [ ] **Step 2: Create PetProfile model**

Create `server/src/models/PetProfile.js`:

```js
const mongoose = require('mongoose');

const petProfileSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sex: { type: String, enum: ['female', 'male'], required: true },
    ageYears: { type: Number, min: 0, default: 0 },
    ageMonths: { type: Number, min: 0, max: 11, default: 0 },
    breed: { type: String, default: '', trim: true },
    weightKg: { type: Number, min: 0, default: 0 },
    allergies: [{ type: String, trim: true }],
    noAllergies: { type: Boolean, default: false },
    healthIssues: [{ type: String, trim: true }],
    healthGoals: [
      {
        type: String,
        enum: ['bone', 'skin_coat', 'teeth', 'digestion'],
      },
    ],
    activityLevel: {
      type: String,
      enum: ['low', 'active', 'very_active'],
      default: 'active',
    },
    weightGoal: {
      type: String,
      enum: ['gain', 'maintain', 'lose'],
      default: 'maintain',
    },
    currentFoodType: {
      type: String,
      enum: ['dry', 'wet', 'mixed'],
      default: 'mixed',
    },
    favoriteFlavors: [{ type: String, trim: true }],
    photoUrl: { type: String, default: '' },
    aiSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PetProfile', petProfileSchema);
```

- [ ] **Step 3: Add controller CRUD skeleton**

Create `server/src/controllers/petProfile.controller.js`:

```js
const PetProfile = require('../models/PetProfile');
const { buildRecommendationForProfile } = require('../services/meowRecommendation.service');

function buildOwnedProfileQuery(profileId, customerId) {
  return { _id: profileId, customer: customerId };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeProfilePayload(body) {
  return {
    name: String(body.name || '').trim(),
    sex: body.sex,
    ageYears: Number(body.ageYears || 0),
    ageMonths: Number(body.ageMonths || 0),
    breed: String(body.breed || '').trim(),
    weightKg: Number(body.weightKg || 0),
    allergies: normalizeArray(body.allergies),
    noAllergies: Boolean(body.noAllergies),
    healthIssues: normalizeArray(body.healthIssues),
    healthGoals: normalizeArray(body.healthGoals),
    activityLevel: body.activityLevel || 'active',
    weightGoal: body.weightGoal || 'maintain',
    currentFoodType: body.currentFoodType || 'mixed',
    favoriteFlavors: normalizeArray(body.favoriteFlavors),
    photoUrl: String(body.photoUrl || '').trim(),
  };
}

exports.buildOwnedProfileQuery = buildOwnedProfileQuery;

exports.list = async (req, res) => {
  const items = await PetProfile.find({ customer: req.customer._id }).sort({ updatedAt: -1 });
  res.json({ items });
};

exports.create = async (req, res) => {
  const data = normalizeProfilePayload(req.body);
  if (!data.name || !data.sex) {
    return res.status(400).json({ message: 'Thieu ten hoac gioi tinh cua be meo' });
  }
  const profile = await PetProfile.create({ ...data, customer: req.customer._id });
  res.status(201).json({ profile });
};

exports.getById = async (req, res) => {
  const profile = await PetProfile.findOne(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  res.json({ profile });
};

exports.update = async (req, res) => {
  const profile = await PetProfile.findOneAndUpdate(
    buildOwnedProfileQuery(req.params.id, req.customer._id),
    normalizeProfilePayload(req.body),
    { new: true, runValidators: true },
  );
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  res.json({ profile });
};

exports.remove = async (req, res) => {
  const profile = await PetProfile.findOneAndDelete(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  res.json({ message: 'Da xoa ho so' });
};

exports.recommendation = async (req, res) => {
  const profile = await PetProfile.findOne(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  const aiSummary = await buildRecommendationForProfile(profile.toObject());
  profile.aiSummary = aiSummary;
  await profile.save();
  res.json({ profile, recommendation: aiSummary });
};
```

- [ ] **Step 4: Add routes and app mount**

Create `server/src/routes/petProfile.routes.js`:

```js
const router = require('express').Router();
const ctrl = require('../controllers/petProfile.controller');
const { requireCustomer } = require('../middlewares/auth');

router.use(requireCustomer);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/recommendation', ctrl.recommendation);

module.exports = router;
```

Modify `server/src/app.js`:

```js
const petProfileRoutes = require('./routes/petProfile.routes');
```

And mount:

```js
app.use('/api/customer/pet-profiles', petProfileRoutes);
```

- [ ] **Step 5: Run tests and commit**

```bash
npm run test -w server
git add server/src/models/PetProfile.js server/src/controllers/petProfile.controller.js server/src/routes/petProfile.routes.js server/src/app.js server/src/controllers/petProfile.controller.test.js
git commit -m "feat: add customer pet profile API"
```

---

## Task 6: AI Recommendation Backend

**Files:**
- Create: `server/src/services/meowRecommendation.service.js`
- Test: `server/src/services/meowRecommendation.service.test.js`

- [ ] **Step 1: Write recommendation service tests**

Create `server/src/services/meowRecommendation.service.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  calculateDailyCalories,
  normalizeCatalogProduct,
  buildDeterministicRecommendation,
} = require('./meowRecommendation.service');

test('calculateDailyCalories returns a positive range', () => {
  const result = calculateDailyCalories({ weightKg: 4.5, activityLevel: 'active', weightGoal: 'maintain' });
  assert.equal(result.min > 0, true);
  assert.equal(result.max >= result.min, true);
});

test('normalizeCatalogProduct keeps compact fields only', () => {
  const product = normalizeCatalogProduct({
    _id: 'p1',
    name: 'Kit Toan Dien',
    slug: 'kit-toan-dien',
    price: 450000,
    salePrice: 399000,
    image: '/a.png',
    foodType: 'mixed',
    healthNeeds: ['digestion'],
    ageRange: 'adult',
    flavor: 'Ga',
    stock: 10,
  });
  assert.deepEqual(Object.keys(product).sort(), [
    'ageRange',
    'finalPrice',
    'flavor',
    'foodType',
    'healthNeeds',
    'id',
    'image',
    'name',
    'slug',
    'stock',
  ].sort());
});

test('buildDeterministicRecommendation returns safe fallback shape', () => {
  const recommendation = buildDeterministicRecommendation(
    { name: 'Pun', weightKg: 4.5, activityLevel: 'active', weightGoal: 'maintain', healthGoals: ['digestion'] },
    [],
  );
  assert.equal(recommendation.petName, 'Pun');
  assert.ok(recommendation.dailyCalories.min > 0);
  assert.ok(Array.isArray(recommendation.warnings));
});
```

Run:

```bash
npm run test -w server
```

Expected: FAIL because service does not exist.

- [ ] **Step 2: Implement recommendation service**

Create `server/src/services/meowRecommendation.service.js` with these exports:

```js
const Product = require('../models/Product');
const { streamChatCompletion } = require('./shineshopChat.service');

const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-meal-kit-mixed',
    name: 'PawWorld Meal Kit Mix Uot & Kho',
    slug: 'meal-kit-ca-nhan-hoa',
    finalPrice: 450000,
    image: '/assets/paw/Cat Food Kit.png',
    foodType: 'mixed',
    healthNeeds: ['digestion', 'skin_coat'],
    ageRange: 'all',
    flavor: 'Ga va ca ngu',
    stock: 0,
  },
  {
    id: 'fallback-digestion-kit',
    name: 'Combo Tieu Hoa Nhe Bung',
    slug: 'meal-kit-ca-nhan-hoa',
    finalPrice: 420000,
    image: '/assets/paw/image 653.png',
    foodType: 'mixed',
    healthNeeds: ['digestion'],
    ageRange: 'all',
    flavor: 'Ga bi do',
    stock: 0,
  },
];

function calculateDailyCalories(profile) {
  const weight = Math.max(Number(profile.weightKg || 0), 1);
  const rer = 70 * Math.pow(weight, 0.75);
  const activityFactor = profile.activityLevel === 'very_active' ? 1.35 : profile.activityLevel === 'low' ? 1.0 : 1.15;
  const goalFactor = profile.weightGoal === 'gain' ? 1.15 : profile.weightGoal === 'lose' ? 0.85 : 1;
  const target = rer * activityFactor * goalFactor;
  return {
    min: Math.round(target * 0.9),
    max: Math.round(target * 1.1),
  };
}

function normalizeCatalogProduct(product) {
  return {
    id: String(product._id || product.id || ''),
    name: product.name,
    slug: product.slug,
    finalPrice: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price || product.finalPrice || 0,
    image: product.image || '',
    foodType: product.foodType || 'dry',
    healthNeeds: product.healthNeeds || [],
    ageRange: product.ageRange || 'all',
    flavor: product.flavor || '',
    stock: product.stock || 0,
  };
}

async function getRecommendationCatalog() {
  const products = await Product.find({ isActive: true }).sort({ isBestSeller: -1, soldCount: -1 }).limit(24);
  const normalized = products.map((product) => normalizeCatalogProduct(product.toObject()));
  if (normalized.length >= 3) return normalized;
  return [...normalized, ...FALLBACK_PRODUCTS];
}

function buildDeterministicRecommendation(profile, catalog) {
  const dailyCalories = calculateDailyCalories(profile);
  const selected = (catalog || []).slice(0, 3);
  return {
    source: 'fallback',
    petName: profile.name,
    summary: `${profile.name} can mot thuc don on dinh, uu tien khau phan vua du va theo doi phan ung sau moi thay doi.`,
    dailyCalories,
    healthReview: {
      goals: profile.healthGoals || [],
      issues: profile.healthIssues || [],
      allergies: profile.noAllergies ? [] : profile.allergies || [],
    },
    products: selected,
    mealPlan: [
      'Chia thanh 2-3 bua moi ngay.',
      'Doi thuc an tu tu trong 5-7 ngay.',
      'Dung coc dong tieu chuan de kiem soat calo.',
    ],
    warnings: ['Ket qua nay khong thay the bac si thu y neu be co trieu chung nang hoac keo dai.'],
  };
}

function buildAiPrompt(profile, catalog) {
  return `Return only valid JSON for PawWorld Meow Quizz recommendation.
Rules:
- Vietnamese output.
- Do not diagnose disease.
- Do not prescribe medicine.
- Recommend veterinary care for severe, recurring, urgent, or unclear symptoms.
- Avoid raw food and bones.

Pet profile:
${JSON.stringify(profile)}

Product catalog:
${JSON.stringify(catalog)}

JSON shape:
{
  "source":"ai",
  "petName":"",
  "summary":"",
  "dailyCalories":{"min":0,"max":0},
  "healthReview":{"goals":[],"issues":[],"allergies":[]},
  "products":[{"id":"","name":"","slug":"","reason":"","dailyUse":""}],
  "mealPlan":[],
  "warnings":[]
}`;
}

async function buildAiRecommendation(profile, catalog) {
  let text = '';
  await streamChatCompletion({
    messages: [{ role: 'user', content: buildAiPrompt(profile, catalog) }],
    onToken: (content) => {
      text += content;
    },
  });
  const parsed = JSON.parse(text);
  return { ...parsed, source: 'ai' };
}

async function buildRecommendationForProfile(profile) {
  const catalog = await getRecommendationCatalog();
  try {
    return await buildAiRecommendation(profile, catalog);
  } catch {
    return buildDeterministicRecommendation(profile, catalog);
  }
}

module.exports = {
  FALLBACK_PRODUCTS,
  calculateDailyCalories,
  normalizeCatalogProduct,
  getRecommendationCatalog,
  buildDeterministicRecommendation,
  buildAiPrompt,
  buildRecommendationForProfile,
};
```

- [ ] **Step 3: Run tests and commit**

```bash
npm run test -w server
git add server/src/services/meowRecommendation.service.js server/src/services/meowRecommendation.service.test.js
git commit -m "feat: add meow recommendation service"
```

---

## Task 7: Meow Quizz Frontend Wizard

**Files:**
- Create: `client/src/pages/public/meowQuizz/meowQuizData.js`
- Create: `client/src/pages/public/meowQuizz/MeowQuizPage.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add pet profile API methods**

Modify `client/src/api/endpoints.js`:

```js
export const petProfileApi = {
  list: () => api.get('/customer/pet-profiles').then((r) => r.data),
  create: (payload) => api.post('/customer/pet-profiles', payload).then((r) => r.data),
  get: (id) => api.get(`/customer/pet-profiles/${id}`).then((r) => r.data),
  update: (id, payload) => api.put(`/customer/pet-profiles/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/customer/pet-profiles/${id}`).then((r) => r.data),
  recommendation: (id) => api.post(`/customer/pet-profiles/${id}/recommendation`).then((r) => r.data),
};
```

- [ ] **Step 2: Create quiz data**

Create `client/src/pages/public/meowQuizz/meowQuizData.js`:

```js
export const initialQuizForm = {
  name: '',
  sex: 'male',
  ageYears: '',
  ageMonths: '',
  breed: '',
  weightKg: 4.5,
  allergies: '',
  noAllergies: false,
  healthIssues: '',
  healthGoals: [],
  activityLevel: '',
  weightGoal: '',
  currentFoodType: '',
  favoriteFlavors: '',
  photoUrl: '',
};

export const healthGoalOptions = [
  { value: 'bone', label: 'Xuong' },
  { value: 'skin_coat', label: 'Da va long' },
  { value: 'teeth', label: 'Rang' },
  { value: 'digestion', label: 'He tieu hoa' },
];

export const activityOptions = [
  { value: 'low', label: 'It hoat dong' },
  { value: 'active', label: 'Nang dong' },
  { value: 'very_active', label: 'Rat nang dong' },
];

export const weightGoalOptions = [
  { value: 'gain', label: 'Tang can' },
  { value: 'maintain', label: 'Giu on dinh' },
  { value: 'lose', label: 'Giam can' },
];

export const foodTypeOptions = [
  { value: 'dry', label: 'Thuc an kho' },
  { value: 'wet', label: 'Thuc an uot' },
  { value: 'mixed', label: 'Ket hop' },
];
```

- [ ] **Step 3: Build Figma quiz shell**

Create `MeowQuizPage.jsx` with:

```text
White quiz header with logo, stepper: 1 Thu cung cua ban, 2 Thuc don, 3 Dat hang.
Lavender background.
Large pale paw decorations left/right.
Centered white card around 520-590px wide.
Back arrow + pill "Buoc X tren 10".
Crayon title.
Small explanatory copy.
Yellow rounded primary button.
```

Use form state and `stepIndex`, with 10 visual steps by grouping logical questions:

```text
1 name + sex
2 age
3 breed + weight
4 allergies
5 health issues + health goals
6 activity
7 weight goal
8 current food type
9 favorite flavor
10 photo upload + save
```

- [ ] **Step 4: Save profile and enforce auth**

In final submit:

```jsx
if (!customer) {
  sessionStorage.setItem('paw_meow_quizz_draft', JSON.stringify(form));
  navigate('/dang-nhap?redirect=/meow-quizz');
  return;
}

const { profile } = await petProfileApi.create(normalizeQuizPayload(form));
navigate(`/meow-quizz/ket-qua/${profile._id}`);
```

Normalize payload:

```js
function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeQuizPayload(form) {
  return {
    ...form,
    ageYears: Number(form.ageYears || 0),
    ageMonths: Number(form.ageMonths || 0),
    weightKg: Number(form.weightKg || 0),
    allergies: splitList(form.allergies),
    healthIssues: splitList(form.healthIssues),
    favoriteFlavors: splitList(form.favoriteFlavors),
  };
}
```

- [ ] **Step 5: Add route**

Modify `App.jsx`:

```jsx
import MeowQuizPage from '@/pages/public/meowQuizz/MeowQuizPage';
```

Add:

```jsx
<Route path="/meow-quizz" element={<MeowQuizPage />} />
```

- [ ] **Step 6: Visual QA quiz wizard**

Open:

```text
http://localhost:5173/meow-quizz
```

Verify desktop and mobile screenshots against the provided quiz Figma screenshots. Fix:

```text
stepper positions, card dimensions, pale paw placement, crayon title size, option row/card states, yellow button height, dropdown/input/weight step controls.
```

- [ ] **Step 7: Build and commit**

```bash
npm run build -w client
git add client/src/api/endpoints.js client/src/pages/public/meowQuizz/meowQuizData.js client/src/pages/public/meowQuizz/MeowQuizPage.jsx client/src/App.jsx
git commit -m "feat: add meow quizz wizard"
```

---

## Task 8: Pet Profile Screens

**Files:**
- Create: `client/src/pages/public/meowQuizz/PetProfilesPage.jsx`
- Create: `client/src/pages/public/meowQuizz/PetProfileEditPage.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Build profile list page**

Create `PetProfilesPage.jsx` to match the Figma "Thu cung cua toi" screen:

```text
Shared quiz header/stepper.
White background content area.
Centered crayon title.
Profile card with image, name, age pill, weight, activity.
Dashed add-new card.
Back button left, continue button right.
Edit and delete icon buttons on profile card.
Delete confirmation modal with title "Xoa ho so", cancel/delete actions.
```

API behavior:

```jsx
const { items } = await petProfileApi.list();
await petProfileApi.remove(profileId);
```

- [ ] **Step 2: Build edit profile page**

Create `PetProfileEditPage.jsx` to match the Figma edit form:

```text
Title: Chinh sua ho so.
Circular avatar.
Name input.
General info section: sex, birthday/age.
Lifestyle section: weight, condition, activity, food type.
Health section: allergy checkboxes and health goals select.
Sticky bottom action bar: Huy bo, Luu thay doi.
```

Use `petProfileApi.get(id)` and `petProfileApi.update(id, payload)`.

- [ ] **Step 3: Add routes**

Modify `App.jsx`:

```jsx
<Route path="/meow-quizz/ho-so" element={<PetProfilesPage />} />
<Route path="/meow-quizz/ho-so/:id/chinh-sua" element={<PetProfileEditPage />} />
```

- [ ] **Step 4: Visual QA profile screens**

Open:

```text
http://localhost:5173/meow-quizz/ho-so
```

Verify profile list, add card, delete modal, and edit page against Figma screenshots.

- [ ] **Step 5: Build and commit**

```bash
npm run build -w client
git add client/src/pages/public/meowQuizz/PetProfilesPage.jsx client/src/pages/public/meowQuizz/PetProfileEditPage.jsx client/src/App.jsx
git commit -m "feat: add pet profile screens"
```

---

## Task 9: Recommendation Screen And Checkout Handoff

**Files:**
- Create: `client/src/pages/public/meowQuizz/RecommendationPage.jsx`
- Create: `client/src/pages/public/meowQuizz/meowRecommendationFallback.js`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Build recommendation page**

Create screen matching the provided final Figma result:

```text
Header/stepper with step 2 active.
Hero lavender band: "Thuc don cua [cat] da san sang!".
Product carousel/hero image area.
Nutrition benefit cards.
Nutrition score/progress panel.
Recommended products panel.
Meal plan bullets.
Bottom CTA: add recommended kit / continue checkout.
Footer visible like public site.
```

On mount:

```jsx
const { recommendation } = await petProfileApi.recommendation(profileId);
```

Display `recommendation.source === 'fallback'` with a small retry affordance, not a scary warning.

- [ ] **Step 2: Add cart handoff**

If a recommendation product has a DB product ID:

```jsx
await addToCart(product.id, 1);
navigate('/thanh-toan');
```

If fallback-only:

```jsx
navigate('/danh-muc/meal-kit-ca-nhan-hoa');
```

- [ ] **Step 3: Add route**

Modify `App.jsx`:

```jsx
<Route path="/meow-quizz/ket-qua/:profileId" element={<RecommendationPage />} />
```

- [ ] **Step 4: Visual QA result screen**

Open a created profile result route and verify against the Figma final recommendation screenshot:

```text
hero/card layout, product image presentation, benefit cards, nutrition ring, recommendation list, bottom CTA, footer.
```

- [ ] **Step 5: Build and commit**

```bash
npm run build -w client
git add client/src/pages/public/meowQuizz/RecommendationPage.jsx client/src/pages/public/meowQuizz/meowRecommendationFallback.js client/src/App.jsx
git commit -m "feat: add meow recommendation result"
```

---

## Task 10: End-To-End Verification

**Files:**
- No new files unless fixing defects found during verification.

- [ ] **Step 1: Run backend tests**

```bash
npm run test -w server
```

Expected: all server tests pass.

- [ ] **Step 2: Run frontend build**

```bash
npm run build -w client
```

Expected: Vite production build succeeds.

- [ ] **Step 3: Browser auth walkthrough**

At `http://localhost:5173/`, verify:

```text
/dang-ky creates a customer.
/dang-nhap logs in.
Header user icon opens dropdown.
Social buttons show "Tinh nang dang phat trien".
/quen-mat-khau returns generic success.
/dat-lai-mat-khau/:token can update password using dev reset URL.
```

- [ ] **Step 4: Browser Meow Quizz walkthrough**

Verify:

```text
Home "Lam Quiz ngay" opens /meow-quizz.
Header "MEOW QUIZZ" opens /meow-quizz.
Quiz can be completed.
Logged-out final submit redirects to login and returns.
Profile is created in DB.
Profile list shows the new cat.
Profile edit saves.
Delete modal deletes.
Recommendation result loads.
Recommended DB product can add to cart and checkout.
```

- [ ] **Step 5: Figma visual review gate**

Capture screenshots:

```text
Desktop: /dang-nhap, /dang-ky, logged-in header dropdown, /meow-quizz steps 1/2/3/4/5/6/7/8/9/10, /meow-quizz/ho-so, edit profile, result.
Mobile: /dang-nhap, /dang-ky, /meow-quizz step 1, /meow-quizz/ho-so, result.
```

Compare them to the provided Figma screenshots. Fix mismatches before final reporting.

- [ ] **Step 6: Commit final fixes**

```bash
git status --short
git add client server
git commit -m "fix: polish meow quizz customer flow"
```

Only run this commit if verification found and fixed issues after previous task commits.

---

## Self-Review

Spec coverage:

- Standalone Meow Quizz route: Task 7.
- Home/header/footer links: Task 4.
- Full customer auth: Tasks 2 and 3.
- Header logged-in dropdown: Task 4.
- Server-backed pet profiles: Task 5 and Task 8.
- AI-controlled recommendation with DB products and fallback products: Task 6 and Task 9.
- Checkout handoff: Task 9.
- Figma visual parity requirement: Task 1 and Task 10.

Known implementation risk:

- Figma MCP access is blocked. If exact node measurements are required, ask the user to grant Figma access or export the relevant frames. Until then, use provided screenshots and browser screenshot review as the source of truth.
