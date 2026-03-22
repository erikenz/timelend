# TimeLend Web

This app is the Vercel-ready Next.js frontend for TimeLend.

## Run Locally

1. Create the env file:

   ```bash
   copy apps\web\.env.example apps\web\.env.local
   ```

2. Set the values in `apps/web/.env.local`:

   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

3. Start the web app:

   ```bash
   pnpm dev:web
   ```

4. Open `http://localhost:3001`.

## Deploy To Vercel

1. Import the repository into Vercel.
2. Set `Root Directory` to `apps/web`.
3. Confirm these settings:
   - Framework Preset: `Next.js`
   - Install Command: `pnpm install --frozen-lockfile`
   - Build Command: `pnpm build`
4. Set env vars:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE`
   - `NEXT_PUBLIC_API_BASE_URL=https://your-api-domain`
5. Deploy.

## What Must Stay Hand-Wired

Do not replace these files with generated UI output:

- `apps/web/lib/api.ts`
- `apps/web/lib/contract.ts`
- `apps/web/lib/wagmi.ts`

They contain the actual API, wallet, and contract wiring for the product.
