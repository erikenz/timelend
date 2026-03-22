# Using v0 Safely In TimeLend

You can use `v0` in this project, but only for presentational UI work.

## Safe Uses

- landing page polish
- card layouts
- spacing, typography, and visual hierarchy
- form styling
- dashboard presentation improvements

## Unsafe Uses

Do not let `v0` rewrite these integration files:

- `apps/web/lib/api.ts`
- `apps/web/lib/contract.ts`
- `apps/web/lib/wagmi.ts`
- `apps/web/components/wallet-connect.tsx`
- `apps/web/components/create-form.tsx`
- `apps/web/components/commitment-card.tsx`

## Recommended Workflow

1. Generate only presentational JSX and CSS in `v0`.
2. Paste that output into a new or isolated component.
3. Keep wallet actions, API calls, env handling, and contract calls wired by hand.
4. If you redesign an existing screen, move the styling over without changing the
   data flow.

## Rule Of Thumb

If a file touches wallet connection, transaction submission, API calls, proof
submission, or environment variables, do not delegate it to `v0`.
