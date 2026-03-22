# TimeLend API

This service persists synced commitments in PostgreSQL, evaluates proof with
Gemini 2.5 Flash, and resolves the deployed Fuji contract on-chain.

## Endpoints

- `GET /`
- `GET /health`
- `POST /commitments/sync`
- `GET /commitments/id/:commitmentId`
- `POST /commitments/:commitmentId/proof`
- `GET /commitments/:commitmentId/proof-file`
- `GET /users/:walletAddress/commitments`
- `GET /users/:walletAddress/stats`

## Runtime Requirements

- PostgreSQL available via `DATABASE_URL`
- RPC access to Avalanche Fuji via `RPC_URL`
- Resolver wallet private key via `PRIVATE_KEY`
- Gemini API key via `GEMINI_API_KEY`

## Local Start

```bash
pnpm --filter api dev
```
