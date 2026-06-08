# Meow Quizz Visual Parity Design

## Context

The current Meow Quizz implementation works as a React/Vite flow, but its visual language does not match the 22 supplied desktop screenshots. The provided designs show a shared PawWorld stepper header, a lavender/cream background system, a centered quiz card, profile management screens, an edit form, a delete modal, and a final recommendation page.

## Goal

Update the Meow Quizz UI to match the supplied screenshots as closely as possible while keeping the existing React routes, API calls, customer auth store, and pet profile payload contract.

## Scope

- Replace the quiz wizard presentation with the screenshot-driven 10-step card flow.
- Align profile list, delete modal, and profile edit screens with the supplied layouts.
- Align the recommendation page with the supplied long-form meal-plan screen, including footer and purchase CTA.
- Keep all changes frontend-focused unless a compile/runtime check reveals an existing integration mismatch.
