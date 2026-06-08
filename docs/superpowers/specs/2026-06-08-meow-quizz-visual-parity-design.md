# Meow Quizz Visual Parity Design

## Context

The current Meow Quizz implementation works as a React/Vite flow, but its visual language does not match the 22 supplied desktop screenshots. The active app at `http://localhost:5173/meow-quizz` currently renders an internal quiz header, progress bar, tape decorations, oversized crayon title, and a 12-step data flow. The provided designs show a shared PawWorld stepper header, a lavender/cream background system, a centered quiz card, profile management screens, an edit form, a delete modal, and a final recommendation page.

## Goal

Update the Meow Quizz UI to match the supplied screenshots as closely as possible while keeping the existing React routes, API calls, customer auth store, and pet profile payload contract.

## Scope

- Replace the quiz wizard presentation with the screenshot-driven 10-step card flow.
- Align profile list, delete modal, and profile edit screens with the supplied layouts.
- Align the recommendation page with the supplied long-form meal-plan screen, including footer and purchase CTA.
- Keep all changes frontend-focused unless a compile/runtime check reveals an existing integration mismatch.

## Visual Contract

Shared Meow Quizz screens use:

- A white `80px` top header with PawWorld logo at left, three center stepper items, and user/search/cart icons at right.
- Header labels: `Thú cưng của bạn`, `Thực đơn`, `Đặt hàng`.
- Quiz background: pale lavender `#f3ddff` with large translucent paw decorations at left and right.
- Quiz card: centered white rounded rectangle, roughly `600px` wide on desktop, with no internal header, no progress bar, no tape decoration, and no heavy shadow.
- Crayon heading font from `FC DK Cool Crayon`.
- Primary button: yellow pill, full width inside quiz cards.
- Form controls: pale lavender fields, subtle purple focus border, selected options using cream background and purple border.

## Flow Mapping

The UI presents 10 visual steps:

1. Name and sex.
2. Age.
3. Weight.
4. Allergies.
5. Health goals.
6. Activity level.
7. Weight goal.
8. Current food type.
9. Favorite flavors.
10. Optional photo upload and save.

The existing backend payload supports more fields than the visual flow. Fields not directly represented by screenshots keep conservative defaults or remain optional.

## Route Requirements

- `/meow-quizz`: quiz wizard.
- `/meow-quizz/ho-so`: pet profile list with add card and delete modal.
- `/meow-quizz/ho-so/:id/chinh-sua`: profile edit form.
- `/meow-quizz/ket-qua/:profileId`: meal recommendation page.

## Testing And Verification

- Add or update frontend source-contract tests for the visual shell, step mapping, and shared header usage.
- Run `npm run test -w client`.
- Run `npm run build -w client`.
- Compare browser screenshots at `http://localhost:5173/` against the provided desktop screenshots, especially quiz steps 1-10, profile list/modal/edit, and recommendation.

## Risks

- The screenshots are static images, not Figma layer data, so exact pixel parity depends on manual browser comparison.
- Existing profile data may not include `photoUrl`; the UI must show a design-faithful fallback.
- Full API walkthrough may require a logged-in customer and backend database availability.
