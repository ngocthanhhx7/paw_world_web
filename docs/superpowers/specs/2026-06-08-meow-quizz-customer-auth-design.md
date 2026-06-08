# Meow Quizz And Customer Auth Design

## Context

PawWorld currently has a React/Vite public frontend, an Express/MongoDB backend, admin-only authentication, product/cart/order APIs, and a PAWWORLD GENIUS AI chatbot powered through the ShineShop OpenAI-compatible API.

This phase starts the Meow Quizz feature as a dedicated public flow, not as the home page. It also adds a complete customer authentication flow because Meow Quizz profiles must be saved server-side and tied to a customer account.

Figma API access for the provided EXE UI nodes returned `403 Forbidden`, so this design is based on the Figma links, screenshots provided in the chat, and the current running app at `http://localhost:5173/`.

## Goals

- Add a standalone Meow Quizz route and connect existing home/header/footer quiz links to it.
- Add customer registration, login, logout, forgot password, and reset password flows.
- Match the provided Figma auth screens and quiz screens as closely as possible in layout, typography, colors, spacing, and interactions.
- Add the customer icon behavior in the public header:
  - Logged out: user icon routes to login.
  - Logged in: user icon opens a dropdown with pet profiles, my orders, and logout.
- Save pet profiles in the database, tied to customer accounts.
- Let AI decide most of the recommendation output from the pet profile and available product data.
- Use database products first, with a mock product fallback when data is unavailable or insufficient.
- End the recommendation path at the existing ordering/checkout flow.

## Non-Goals

- Do not implement real Google or Facebook OAuth in this phase.
- Do not merge customer auth with admin auth.
- Do not replace veterinary care or produce diagnosis-style medical claims.
- Do not build a full customer dashboard beyond the account menu targets needed by the flow.
- Do not require email infrastructure for social login.

## Visual Requirements

### Shared Auth Page Shell

Auth pages use the same public header visual style shown in Figma:

- White top bar with PawWorld logo on the left.
- Center navigation: Meow Quizz, Ve chung toi, Shop Meal Kit, Lien he.
- Right actions: user icon, search icon, cart icon.
- Lavender page background.
- Large pale paw-print decorations on left and right.
- Centered white card with rounded corners.
- Decorative tape stickers around the card.
- Crayon-style page title using the existing `FC DK Cool Crayon` font.

### Login Screen

Route: `/dang-nhap`

Content:

- Title: `Chao mung tro lai`
- Email field.
- Password field with show/hide icon.
- `Quen mat khau?` link.
- Primary yellow `Dang nhap` button.
- Divider text: `Tiep tuc voi`
- Google and Facebook buttons.
- Footer prompt: `Ban chua co tai khoan? Dang ky`

Behavior:

- Validates required email and password.
- Submits to customer login API.
- On success, stores customer state in frontend store and redirects to the intended route if present, otherwise home or Meow Quizz.
- Google/Facebook buttons show a toast: `Tinh nang dang phat trien`.

### Register Screen

Route: `/dang-ky`

Content:

- Title: `Chao mung ban nhe`
- Full name field.
- Email field.
- Password field with show/hide icon.
- Primary yellow `Dang ky` button.
- Divider text: `Tiep tuc voi`
- Google and Facebook buttons.
- Footer prompt: `Ban da co tai khoan? Dang nhap`

Behavior:

- Validates required name, email, and password.
- Submits to customer registration API.
- On success, logs the user in and redirects to the intended route if present, otherwise Meow Quizz.
- Duplicate email returns a clear Vietnamese error.
- Google/Facebook buttons show a toast: `Tinh nang dang phat trien`.

### Forgot Password Screen

Route: `/quen-mat-khau`

Content:

- Uses the same shell/card design.
- Title communicates password recovery.
- Email field.
- Primary button to request reset.
- Link back to login.

Behavior:

- Accepts email.
- Backend creates a reset token and expiry if the customer exists.
- Response is intentionally generic to avoid account enumeration.
- In development, the API may return the reset URL in the response so the flow can be tested without email infrastructure.

### Reset Password Screen

Route: `/dat-lai-mat-khau/:token`

Content:

- Uses the same shell/card design.
- New password field.
- Confirm password field.
- Primary button to save.
- Link back to login.

Behavior:

- Validates token, expiry, and password confirmation.
- On success, clears reset token fields and redirects to login.

### Logged-In Header Dropdown

When a customer is authenticated, clicking the user icon opens a Figma-style dropdown anchored below the icon.

Dropdown items:

- `Ho so thu cung` routes to pet profile list.
- `Don hang cua toi` routes to order tracking or a future customer orders route.
- `Dang xuat` calls customer logout and returns to logged-out state.

The dropdown closes on outside click, route change, or logout.

## Customer Auth Architecture

### Backend Models

Add `Customer` model:

- `fullName`: required string.
- `email`: required unique lowercase string.
- `password`: required, select false, bcrypt hashed.
- `phone`: optional string for future checkout/account sync.
- `avatar`: optional string.
- `isActive`: boolean default true.
- `emailVerifiedAt`: optional date for future email verification.
- `lastLoginAt`: optional date.
- `resetPasswordTokenHash`: optional string.
- `resetPasswordExpiresAt`: optional date.
- timestamps.

Admin remains in the existing `Admin` model.

### Backend API

Add customer endpoints under `/api/auth/customer`:

- `POST /register`
- `POST /login`
- `GET /me`
- `POST /logout`
- `POST /forgot-password`
- `POST /reset-password`

Authentication:

- Use a separate JWT payload with `type: 'customer'`.
- Store customer token in `paw_customer_token` cookie.
- Cookie is `httpOnly`, `sameSite: 'lax'`, and `secure` in production.
- Customer auth middleware reads only customer tokens and sets `req.customer`.
- Admin middleware continues to read admin token and set `req.admin`.

Security behavior:

- Passwords are hashed with bcrypt.
- Login errors use generic wording.
- Forgot password response does not reveal whether an email exists.
- Reset tokens are random values stored hashed in the database.
- Customer token is not stored in `localStorage`.

### Frontend State

Add a customer auth store separate from the current admin `authStore`.

State:

- `customer`
- `ready`
- `loading`
- `init`
- `register`
- `login`
- `logout`
- `forgotPassword`
- `resetPassword`

`App.jsx` initializes both cart and customer auth. Admin auth initialization remains available for admin routes.

## Meow Quizz Architecture

### Route Structure

Recommended routes:

- `/meow-quizz`: quiz wizard.
- `/meow-quizz/ho-so`: pet profile list.
- `/meow-quizz/ho-so/:id/chinh-sua`: edit pet profile.
- `/meow-quizz/ket-qua/:profileId`: AI recommendation and meal kit result.

Existing links to quiz should point to `/meow-quizz`:

- Header `MEOW QUIZZ`
- Home CTA `Lam Quiz ngay`
- Footer Meow Quizz/support links

### Login Requirement

Meow Quizz can be started while logged out, but saving profile and generating DB-backed recommendations requires a customer account.

Preferred flow:

- If logged in, quiz saves directly.
- If logged out and the user reaches final save/generate step, redirect to `/dang-nhap?redirect=/meow-quizz`.
- After login/register, return to the quiz flow and continue.

If preserving in-progress answers across auth redirect is implemented, store temporary quiz answers in `sessionStorage` only.

### Quiz Questions

Base question sequence:

1. Cat name and sex: `co be ngoan` or `cau be ngoan`.
2. Age: years and months.
3. Breed.
4. Current weight in kg.
5. Allergies.
6. Health issues.
7. Health goals: bone, skin/coat, teeth, digestion.
8. Activity level: low, active, very active.
9. Weight goal: gain, maintain, lose.
10. Current food type: dry, wet, mixed.
11. Favorite flavor.
12. Optional cat photo upload.

The provided Figma screenshots show `Buoc X tren 10`, but the expanded product requirement includes more than 10 logical prompts. The implementation should keep the visual step label compatible with Figma while grouping related prompts where needed.

### Pet Profile Model

Add `PetProfile` model:

- `customer`: required reference to Customer.
- `name`
- `sex`: `female` or `male`.
- `ageYears`
- `ageMonths`
- `breed`
- `weightKg`
- `allergies`: string array or free-text array.
- `noAllergies`: boolean.
- `healthIssues`: string array/free text.
- `healthGoals`: enum array: `bone`, `skin_coat`, `teeth`, `digestion`.
- `activityLevel`: `low`, `active`, `very_active`.
- `weightGoal`: `gain`, `maintain`, `lose`.
- `currentFoodType`: `dry`, `wet`, `mixed`.
- `favoriteFlavors`: string array/free text.
- `photoUrl`: optional string.
- `aiSummary`: object snapshot of latest AI recommendation.
- timestamps.

Authorization:

- Customers can only list/read/update/delete their own pet profiles.

### Pet Profile API

Add endpoints under `/api/customer/pet-profiles`:

- `GET /`
- `POST /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/recommendation`

All endpoints require customer auth.

## AI Recommendation Design

The AI should decide most of the output from:

- Pet profile answers.
- Available product list from the database.
- Fallback mock products if DB results are unavailable.
- Nutrition guardrails based on WSAVA-style nutrition assessment principles.

Recommendation output:

- Review of stated health status and goals.
- Suggested daily calorie range.
- Recommended meal kit/products.
- Suggested feeding plan and daily routine.
- Reasons for product choices.
- Warnings if the profile includes symptoms or health issues that should involve a veterinarian.

Guardrails:

- Do not diagnose disease.
- Do not prescribe medication or therapeutic diets as certainty.
- Encourage veterinary consultation for severe, recurring, urgent, or unclear symptoms.
- Prefer complete-and-balanced food guidance where possible.
- Avoid raw food/bone recommendations.

Product source strategy:

- Query active products from DB.
- Prefer products matching age range, food type, health needs, flavor, and stock.
- If DB products are missing or insufficient, merge in fallback product objects with the same shape.
- The AI receives a compact product catalog, not the whole database document.

Fallback behavior:

- If AI request fails, show a deterministic fallback recommendation generated from profile answers and product matching.
- The UI should clearly show that the AI result could not be refreshed and offer retry.

## Checkout Integration

The recommendation screen should allow adding recommended product(s) to the cart and moving to checkout.

If the recommended item is a DB product, use the normal cart API.

If the recommendation contains a fallback-only product, the UI should display it as a suggested meal kit but not silently add an invalid product ID to cart. It should route the user to the matching category or ask them to choose an available equivalent.

## Testing And Verification

Backend tests:

- Customer register hashes password and rejects duplicate email.
- Customer login accepts valid credentials and rejects invalid credentials.
- Customer `me` requires valid customer token.
- Customer logout clears cookie.
- Forgot password response is generic.
- Reset password accepts valid token and rejects invalid/expired token.
- Pet profile APIs enforce ownership.
- Recommendation endpoint uses DB products and fallback products correctly.

Frontend verification:

- Auth pages match Figma screenshots across desktop and mobile.
- Header user icon routes correctly when logged out.
- Header dropdown appears when logged in and closes correctly.
- Register/login redirects back to intended route.
- Social buttons show development toast.
- Quiz can create a DB-backed profile.
- Profile list, edit, delete, and recommendation screens work.
- Recommendation can add DB products to cart and proceed to checkout.

Browser review:

- Run the app at `http://localhost:5173/`.
- Verify the home header, auth pages, quiz flow, pet profile screens, recommendation screen, and checkout handoff.

## Open Risks

- Figma API is currently inaccessible with `403 Forbidden`, so exact pixel/layer extraction is unavailable until access is fixed.
- Real email delivery is not included; password reset testing should rely on dev-visible reset URL or server logs until email is configured.
- Google/Facebook OAuth is intentionally deferred; buttons are UI stubs in this phase.
- The exposed ShineShop API key should be rotated because it appeared in the shared IDE/chat context.
