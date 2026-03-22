# TimeLend

TimeLend is a hackathon-ready accountability app that locks AVAX on Avalanche
Fuji, stores commitment state in PostgreSQL, verifies proof with Gemini 2.5
Flash, and resolves the commitment on-chain.

## Active Apps

- `apps/web`: Next.js frontend, ready for Vercel
- `apps/api`: NestJS backend, ready for Render or Railway
- `apps/timelend-contract`: Hardhat project for the TimeLend smart contract
- `packages/contracts`: shared ABI and deployed contract metadata

## Product Flow

1. The user connects a wallet in `apps/web`.
2. The user creates a commitment and locks AVAX on-chain.
3. The frontend syncs the on-chain commitment into the API.
4. The API persists the commitment in PostgreSQL.
5. The user submits proof as text, a file, or both.
6. The API sends the proof to Gemini 2.5 Flash.
7. The API resolves the deployed contract:
   - `PASS`: funds return to the user
   - `FAIL`: funds go to the penalty wallet
8. The dashboard refreshes with the new status and tx hash.

## Contract

- Deployed contract: `0x5192258383C8cc29571e57697eAD535b96535bdE`
- Network: Avalanche Fuji
- Shared ABI source: `packages/contracts/timelend-contract.ts`

## Run The Web App Only

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create the frontend env file:

   ```bash
   copy apps\web\.env.example apps\web\.env.local
   ```

3. Fill `apps/web/.env.local`:

   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

4. Start the frontend:

   ```bash
   pnpm dev:web
   ```

5. Open `http://localhost:3001`.

This is enough to view the UI, but the dashboard and proof flow require the API.

## Run The Full App Locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Create env files:

   ```bash
   copy apps\web\.env.example apps\web\.env.local
   copy apps\api\.env.example apps\api\.env
   copy apps\timelend-contract\.env.example apps\timelend-contract\.env
   ```

4. Fill `apps/api/.env` with at least:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timelend
   RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE
   PRIVATE_KEY=0xYOUR_BACKEND_RESOLVER_PRIVATE_KEY
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ALLOWED_ORIGINS=http://localhost:3001
   MODE=real
   PORT=3000
   ```

5. Start the backend:

   ```bash
   pnpm dev:api
   ```

6. Start the frontend:

   ```bash
   pnpm dev:web
   ```

7. Verify:
   - Frontend: `http://localhost:3001`
   - Backend health: `http://localhost:3000/health`

## Host The SQL Database

### Recommended: Neon Postgres

1. Create a project at Neon.
2. Copy the connection string.
3. Put it into `apps/api/.env` or your Render/Railway envs as:

   ```env
   DATABASE_URL=postgresql://...
   DATABASE_SSL=require
   ```

Neon is the best fit here because the API only needs standard Postgres and this
repo already uses the `pg` driver directly.

## Deploy The Web App

### Vercel

1. Import the repository into Vercel.
2. Set `Root Directory = apps/web`.
3. Confirm:
   - Framework Preset: `Next.js`
   - Install Command: `pnpm install --frozen-lockfile`
   - Build Command: `pnpm build`
4. Set env vars:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE`
   - `NEXT_PUBLIC_API_BASE_URL=https://your-api-domain`
5. Deploy.

Extra web-specific notes live in `apps/web/README.md`.

## Deploy The API

### Render

This repo includes `render.yaml` for the backend service.

1. Create a new Render service from this repo.
2. Render will detect `render.yaml`.
3. Provide these secret env vars in Render:
   - `DATABASE_URL`
   - `PRIVATE_KEY`
   - `GEMINI_API_KEY`
   - `ALLOWED_ORIGINS`
4. Keep the default non-secret values from `render.yaml`:
   - `DATABASE_SSL=require`
   - `RPC_URL=https://api.avax-test.network/ext/bc/C/rpc`
   - `CONTRACT_ADDRESS=0x5192258383C8cc29571e57697eAD535b96535bdE`
   - `MODE=real`
   - `PORT=3000`

### Railway

If you prefer Railway, use:

- Build command:

  ```bash
  pnpm install --frozen-lockfile && pnpm --filter api build
  ```

- Start command:

  ```bash
  pnpm --filter api start:prod
  ```

Use the same env vars as Render.

## v0 Guidance

You can use `v0` for UI work, but not for product wiring.

Safe:

- landing page polish
- cards and layout
- spacing and typography
- dashboard presentation

Unsafe:

- `apps/web/lib/api.ts`
- `apps/web/lib/contract.ts`
- `apps/web/lib/wagmi.ts`
- wallet connection flow
- proof submission flow
- env/config handling

More detailed rules live in `apps/web/V0_USAGE.md`.

## Build Checks

- API build:

  ```bash
  pnpm build:api
  ```

- Web build:

  ```bash
  pnpm build:web
  ```

- Contract compile:

  ```bash
  cd apps/timelend-contract
  npx hardhat compile
  ```
